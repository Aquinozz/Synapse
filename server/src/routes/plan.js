import { Router } from 'express';
import { SESSION_FORMATS } from '../config.js';
import { UNIQUE_VIOLATION } from '../db.js';
import { badRequest, conflict, notFound } from '../errors.js';
import { getPublicProfile } from '../psychologists.js';
import {
  describeWeek,
  endOfWeek,
  fromLocalIso,
  occurrenceInWeek,
  toLocalIso,
  weekKey,
} from '../schedule.js';
import * as v from '../validate.js';

const pad = (n) => String(n).padStart(2, '0');

const slotTaken = () => conflict('Este horário acabou de ser ocupado. Escolha outro.', 'slot_taken');

/** The employee's weekly session: fixed psychologist and slot, plus a one-off reschedule */
export const planRoutes = ({ db, now }) => {
  const router = Router();

  const getPlan = async (q, employeeId) => {
    const [plan] = await q.query(
      `SELECT psychologist_id AS "psychologistId", weekday, time, format
         FROM weekly_plans WHERE employee_id = $1`,
      [employeeId]
    );
    return plan;
  };

  /** This week's reschedule as a Date, if there is one */
  const getReschedule = async (q, employeeId, current) => {
    const [row] = await q.query(
      'SELECT starts_at AS "startsAt" FROM reschedules WHERE employee_id = $1 AND week_start = $2',
      [employeeId, weekKey(current)]
    );
    return row ? fromLocalIso(row.startsAt) : null;
  };

  const describe = async (employeeId) => {
    const plan = await getPlan(db, employeeId);
    if (!plan) return { plan: null };

    const current = now();
    const rescheduledTo = await getReschedule(db, employeeId, current);
    const { doneThisWeek, next } = describeWeek(plan, rescheduledTo, current);
    return {
      plan: {
        ...plan,
        rescheduledTo: rescheduledTo ? toLocalIso(rescheduledTo) : null,
        nextSession: toLocalIso(next),
        doneThisWeek,
      },
      psychologist: await getPublicProfile(db, plan.psychologistId, employeeId),
    };
  };

  /** Two requests for the same slot at once: the database's unique rules reject the second */
  const inTransaction = async (fn) => {
    try {
      return await db.transaction(fn);
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) throw slotTaken();
      throw err;
    }
  };

  router.get('/', async (req, res) => {
    res.json(await describe(req.user.id));
  });

  // Choose a psychologist and fixed weekly slot, or change the current one
  router.put('/', async (req, res) => {
    const body = req.body ?? {};
    const psychologistId = v.id(body.psychologistId, 'Psicólogo');
    const weekday = v.weekday(body.weekday);
    const time = v.time(body.time);
    const format = v.oneOf(body.format, SESSION_FORMATS, 'Formato');
    const employeeId = req.user.id;

    await inTransaction(async (q) => {
      if (!(await getPublicProfile(q, psychologistId))) throw notFound('Psicólogo não encontrado.');

      const offered = await q.query(
        'SELECT 1 FROM availability WHERE psychologist_id = $1 AND weekday = $2 AND time = $3',
        [psychologistId, weekday, time]
      );
      if (offered.length === 0) {
        throw badRequest('Este horário não é oferecido por este psicólogo.', 'slot_not_offered');
      }

      const [holder] = await q.query(
        'SELECT employee_id AS "employeeId" FROM weekly_plans WHERE psychologist_id = $1 AND weekday = $2 AND time = $3',
        [psychologistId, weekday, time]
      );
      if (holder && holder.employeeId !== employeeId) throw slotTaken();

      // Someone may have moved this week's session into that slot
      const current = now();
      const thisWeek = toLocalIso(occurrenceInWeek(weekday, time, current));
      const movedIn = await q.query(
        'SELECT 1 FROM reschedules WHERE psychologist_id = $1 AND starts_at = $2 AND employee_id <> $3',
        [psychologistId, thisWeek, employeeId]
      );
      if (movedIn.length > 0) {
        throw conflict('Este horário está ocupado nesta semana. Escolha outro.', 'slot_taken');
      }

      await q.query(
        `INSERT INTO weekly_plans (employee_id, psychologist_id, weekday, time, format)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (employee_id) DO UPDATE SET
           psychologist_id = excluded.psychologist_id,
           weekday = excluded.weekday,
           time = excluded.time,
           format = excluded.format,
           updated_at = now()`,
        [employeeId, psychologistId, weekday, time, format]
      );

      // A new fixed slot replaces any one-off change still pending
      await q.query('DELETE FROM reschedules WHERE employee_id = $1 AND week_start >= $2', [
        employeeId,
        weekKey(current),
      ]);
    });

    res.json(await describe(employeeId));
  });

  // Move only this week's session to another free slot of the same psychologist
  router.post('/reschedule', async (req, res) => {
    const employeeId = req.user.id;
    const target = fromLocalIso(req.body?.startsAt);
    if (!target) throw badRequest('Data inválida. Use o formato AAAA-MM-DDTHH:MM.');

    await inTransaction(async (q) => {
      const plan = await getPlan(q, employeeId);
      if (!plan) throw conflict('Escolha um psicólogo e um horário fixo antes de remarcar.', 'no_plan');

      const current = now();
      const { doneThisWeek, thisWeek } = describeWeek(plan, await getReschedule(q, employeeId, current), current);
      if (doneThisWeek) {
        throw conflict('A sessão desta semana já aconteceu. O plano cobre 1 sessão por semana.', 'week_done');
      }
      if (target.getTime() <= current.getTime() || target.getTime() >= endOfWeek(current).getTime()) {
        throw badRequest('Escolha um horário futuro dentro desta semana.', 'outside_week');
      }
      if (target.getTime() === thisWeek.getTime()) {
        throw badRequest('Sua sessão já está marcada para este horário.', 'same_slot');
      }

      const weekday = target.getDay();
      const time = `${pad(target.getHours())}:${pad(target.getMinutes())}`;
      const offered = await q.query(
        'SELECT 1 FROM availability WHERE psychologist_id = $1 AND weekday = $2 AND time = $3',
        [plan.psychologistId, weekday, time]
      );
      if (offered.length === 0) {
        throw badRequest('Este horário não é oferecido pelo seu psicólogo.', 'slot_not_offered');
      }

      // Going back to the regular slot simply cancels the change
      const week = weekKey(current);
      if (weekday === plan.weekday && time === plan.time) {
        await q.query('DELETE FROM reschedules WHERE employee_id = $1 AND week_start = $2', [employeeId, week]);
        return;
      }

      const startsAt = toLocalIso(target);
      const heldByPlan = await q.query(
        'SELECT 1 FROM weekly_plans WHERE psychologist_id = $1 AND weekday = $2 AND time = $3',
        [plan.psychologistId, weekday, time]
      );
      const heldByReschedule = await q.query(
        'SELECT 1 FROM reschedules WHERE psychologist_id = $1 AND starts_at = $2 AND employee_id <> $3',
        [plan.psychologistId, startsAt, employeeId]
      );
      if (heldByPlan.length > 0 || heldByReschedule.length > 0) throw slotTaken();

      await q.query(
        `INSERT INTO reschedules (employee_id, week_start, psychologist_id, starts_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (employee_id, week_start) DO UPDATE SET
           psychologist_id = excluded.psychologist_id,
           starts_at = excluded.starts_at`,
        [employeeId, week, plan.psychologistId, startsAt]
      );
    });

    res.json(await describe(employeeId));
  });

  return router;
};
