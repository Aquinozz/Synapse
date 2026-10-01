import { Router } from 'express';
import { FOREIGN_KEY_VIOLATION } from '../db.js';
import { badRequest, conflict } from '../errors.js';
import { getPublicProfile } from '../psychologists.js';
import { describeWeek, fromLocalIso, toLocalIso, weekKey } from '../schedule.js';
import * as v from '../validate.js';

const MAX_SLOTS = 80;
const MAX_TAGS = 4;
const ICON_NAME = /^[a-z0-9_]{1,40}$/;

const slotInUse = () =>
  conflict(
    'Há pacientes com horário fixo em vagas que você está fechando. Remaneje esses pacientes antes.',
    'slot_in_use'
  );

/** The psychologist's own area: profile, weekly availability and patients */
export const psiRoutes = ({ db, now }) => {
  const router = Router();

  const availabilityOf = async (q, psychologistId) =>
    q.query(
      `SELECT a.weekday, a.time, w.employee_id IS NOT NULL AS taken
         FROM availability a
         LEFT JOIN weekly_plans w
           ON w.psychologist_id = a.psychologist_id AND w.weekday = a.weekday AND w.time = a.time
        WHERE a.psychologist_id = $1
        ORDER BY a.weekday, a.time`,
      [psychologistId]
    );

  // The psychologist's own profile, exactly as employees see it (plus the review status)
  const ownProfile = (psychologistId) => getPublicProfile(db, psychologistId, null, { includePending: true });

  router.get('/profile', async (req, res) => {
    res.json({ profile: await ownProfile(req.user.id) });
  });

  router.put('/profile', async (req, res) => {
    const body = req.body ?? {};
    if (typeof body.bio !== 'string') throw badRequest('Informe a apresentação.');
    const bio = body.bio.trim();
    if (bio.length > 220) throw badRequest('A apresentação deve ter no máximo 220 caracteres.');
    if (!Array.isArray(body.tags) || body.tags.length === 0 || body.tags.length > MAX_TAGS) {
      throw badRequest(`Escolha de 1 a ${MAX_TAGS} especialidades.`);
    }

    const tags = new Map();
    for (const tag of body.tags) {
      const label = v.text(tag?.label, 'a especialidade', { max: 60 });
      if (typeof tag.icon !== 'string' || !ICON_NAME.test(tag.icon)) throw badRequest('Ícone inválido.');
      tags.set(label, tag.icon);
    }
    const psychologistId = req.user.id;

    await db.transaction(async (q) => {
      await q.query('UPDATE psychologists SET bio = $1 WHERE user_id = $2', [bio, psychologistId]);

      // Keep the category of tags that stay, drop the removed ones, add the new ones
      const existing = (
        await q.query('SELECT label FROM psychologist_tags WHERE psychologist_id = $1', [psychologistId])
      ).map((row) => row.label);
      for (const label of existing) {
        if (!tags.has(label)) {
          await q.query('DELETE FROM psychologist_tags WHERE psychologist_id = $1 AND label = $2', [
            psychologistId,
            label,
          ]);
        }
      }
      for (const [label, icon] of tags) {
        if (!existing.includes(label)) {
          await q.query('INSERT INTO psychologist_tags (psychologist_id, label, icon) VALUES ($1, $2, $3)', [
            psychologistId,
            label,
            icon,
          ]);
        }
      }
    });

    res.json({ profile: await ownProfile(psychologistId) });
  });

  router.get('/availability', async (req, res) => {
    res.json({ slots: await availabilityOf(db, req.user.id) });
  });

  // Replaces the whole set of weekly slots. Slots held by a patient cannot be removed.
  router.put('/availability', async (req, res) => {
    const input = req.body?.slots;
    if (!Array.isArray(input)) throw badRequest('Envie a lista de horários em "slots".');
    if (input.length > MAX_SLOTS) throw badRequest(`Informe no máximo ${MAX_SLOTS} horários.`);

    const wanted = new Map();
    for (const slot of input) {
      const weekday = v.weekday(slot?.weekday);
      const time = v.time(slot?.time);
      wanted.set(`${weekday}-${time}`, { weekday, time });
    }
    const psychologistId = req.user.id;

    try {
      await db.transaction(async (q) => {
        const current = await availabilityOf(q, psychologistId);
        if (current.some((slot) => slot.taken && !wanted.has(`${slot.weekday}-${slot.time}`))) throw slotInUse();

        for (const slot of current) {
          if (!wanted.has(`${slot.weekday}-${slot.time}`)) {
            await q.query('DELETE FROM availability WHERE psychologist_id = $1 AND weekday = $2 AND time = $3', [
              psychologistId,
              slot.weekday,
              slot.time,
            ]);
          }
        }
        for (const slot of wanted.values()) {
          await q.query(
            'INSERT INTO availability (psychologist_id, weekday, time) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [psychologistId, slot.weekday, slot.time]
          );
        }
      });
    } catch (err) {
      // A patient took the slot between the check and the delete
      if (err.code === FOREIGN_KEY_VIOLATION) throw slotInUse();
      throw err;
    }

    res.json({ slots: await availabilityOf(db, psychologistId) });
  });

  // Employees with a fixed weekly slot with this psychologist
  router.get('/patients', async (req, res) => {
    const current = now();
    const rows = await db.query(
      `SELECT u.id, u.name, w.weekday, w.time, w.format, w.created_at AS since, r.starts_at AS "rescheduledTo"
         FROM weekly_plans w
         JOIN users u ON u.id = w.employee_id
         LEFT JOIN reschedules r ON r.employee_id = w.employee_id AND r.week_start = $1
        WHERE w.psychologist_id = $2
        ORDER BY w.weekday, w.time`,
      [weekKey(current), req.user.id]
    );

    const patients = rows.map((row) => {
      const moved = row.rescheduledTo ? fromLocalIso(row.rescheduledTo) : null;
      const { next, doneThisWeek } = describeWeek(row, moved, current);
      return { ...row, nextSession: toLocalIso(next), doneThisWeek };
    });

    res.json({ patients });
  });

  return router;
};
