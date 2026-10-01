import { Router } from 'express';
import { APPROACHES, LANGUAGES, PROFILE_LIMITS, SPECIALTIES } from '../catalog.js';
import { CHECKIN, EVALUATION } from '../config.js';
import { FOREIGN_KEY_VIOLATION } from '../db.js';
import { badRequest, conflict, notFound } from '../errors.js';
import { getPublicProfile } from '../psychologists.js';
import { listReviews } from '../reviews.js';
import { describeWeek, fromLocalIso, toLocalIso, weekKey, zonedNow } from '../schedule.js';
import * as v from '../validate.js';

const MAX_SLOTS = 80;

/** A list of catalog options chosen for the profile: known values only, no repeats, within the limit */
const chosen = (value, options, max, field) => {
  if (!Array.isArray(value)) throw badRequest(`Envie a lista de ${field}.`);
  const unique = [...new Set(value)];
  if (unique.some((item) => !options.includes(item))) throw badRequest(`Há ${field} que não existem no catálogo.`);
  if (unique.length > max) throw badRequest(`Escolha no máximo ${max} ${field}.`);
  // Keeps the catalog order, whatever order the client sent
  return options.filter((item) => unique.includes(item));
};

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
    const specialties = chosen(body.specialties, SPECIALTIES, PROFILE_LIMITS.specialties, 'especialidades');
    const approaches = chosen(body.approaches ?? [], APPROACHES, PROFILE_LIMITS.approaches, 'abordagens');
    const languages = chosen(body.languages, LANGUAGES, PROFILE_LIMITS.languages, 'idiomas');
    if (specialties.length === 0) throw badRequest('Escolha pelo menos uma especialidade.');
    if (languages.length === 0) throw badRequest('Escolha pelo menos um idioma de atendimento.');
    const psychologistId = req.user.id;

    await db.query(
      'UPDATE psychologists SET bio = $1, specialties = $2, approaches = $3, languages = $4 WHERE user_id = $5',
      [bio, specialties, approaches, languages, psychologistId]
    );

    res.json({ profile: await ownProfile(psychologistId) });
  });

  // Profile photo shown to employees in the directory: an image cropped by the app, or null to remove it
  router.put('/avatar', async (req, res) => {
    const image = v.avatar(req.body?.image);
    await db.query('UPDATE psychologists SET avatar_url = $1 WHERE user_id = $2', [image, req.user.id]);
    res.json({ profile: await ownProfile(req.user.id) });
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
      `SELECT u.id, u.name, u.avatar, w.weekday, w.time, w.format, w.created_at AS since, r.starts_at AS "rescheduledTo"
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

  // ---- Alerts: patients whose daily check-in came out very low

  // The latest low check-in of each current patient that nobody marked as seen, most recent first
  const alertsOf = async (psychologistId) => {
    const current = now();
    const since = new Date(current.getFullYear(), current.getMonth(), current.getDate() - CHECKIN.alertDays);
    return db.query(
      `SELECT * FROM (
         SELECT DISTINCT ON (c.employee_id) c.employee_id AS "patientId", u.name, u.avatar, c.day, c.score
           FROM checkins c
           JOIN weekly_plans w ON w.employee_id = c.employee_id AND w.psychologist_id = $1
           JOIN users u ON u.id = c.employee_id
          WHERE c.score <= $2 AND c.alert_seen_at IS NULL AND c.day >= $3
          ORDER BY c.employee_id, c.day DESC
       ) latest
       ORDER BY day DESC, name`,
      [psychologistId, CHECKIN.lowScore, toLocalIso(since).slice(0, 10)]
    );
  };

  router.get('/alerts', async (req, res) => {
    res.json({ alerts: await alertsOf(req.user.id) });
  });

  // Marks the patient's low check-ins as seen
  router.post('/alerts/:id/seen', async (req, res) => {
    const employeeId = v.id(req.params.id, 'Paciente');
    await db.query(
      `UPDATE checkins c SET alert_seen_at = now()
        WHERE c.employee_id = $1 AND c.alert_seen_at IS NULL AND c.score <= $2
          AND EXISTS (SELECT 1 FROM weekly_plans w WHERE w.employee_id = c.employee_id AND w.psychologist_id = $3)`,
      [employeeId, CHECKIN.lowScore, req.user.id]
    );
    res.json({ alerts: await alertsOf(req.user.id) });
  });

  // What the patients said about this psychologist, without their names
  router.get('/reviews', async (req, res) => {
    res.json(await listReviews(db, req.user.id));
  });

  // ---- Session evaluations: the score the psychologist gives to each session with a patient

  const EVALUATION_COLUMNS = 'e.employee_id AS "patientId", e.session_date AS date, e.score, e.comment';

  /** The patient's plan with this psychologist; people who are not their patients do not exist here */
  const patientPlan = async (psychologistId, employeeId) => {
    const [plan] = await db.query(
      'SELECT created_at FROM weekly_plans WHERE psychologist_id = $1 AND employee_id = $2',
      [psychologistId, employeeId]
    );
    if (!plan) throw notFound('Paciente não encontrado.');
    return plan;
  };

  /** "YYYY-MM-DD" of a real calendar day */
  const sessionDate = (value) => {
    if (!fromLocalIso(`${value}T00:00`)) throw badRequest('Data da sessão inválida. Use o formato AAAA-MM-DD.');
    return value;
  };

  // Every evaluation of the current patients, oldest first
  router.get('/evaluations', async (req, res) => {
    const evaluations = await db.query(
      `SELECT ${EVALUATION_COLUMNS}
         FROM session_evaluations e
         JOIN weekly_plans w ON w.employee_id = e.employee_id AND w.psychologist_id = e.psychologist_id
        WHERE e.psychologist_id = $1
        ORDER BY e.session_date, e.employee_id`,
      [req.user.id]
    );
    res.json({ evaluations });
  });

  // Gives (or changes) the score of one session. One evaluation per patient per day.
  router.put('/patients/:id/evaluations/:date', async (req, res) => {
    const employeeId = v.id(req.params.id, 'Paciente');
    const date = sessionDate(req.params.date);
    const { score, comment = '' } = req.body ?? {};
    if (!Number.isInteger(score) || score < EVALUATION.minScore || score > EVALUATION.maxScore) {
      throw badRequest(`Dê uma nota de ${EVALUATION.minScore} a ${EVALUATION.maxScore}.`);
    }
    if (typeof comment !== 'string') throw badRequest('Comentário inválido.');
    const text = comment.trim();
    if (text.length > EVALUATION.commentMax) {
      throw badRequest(`O comentário deve ter no máximo ${EVALUATION.commentMax} caracteres.`);
    }

    const plan = await patientPlan(req.user.id, employeeId);
    if (date > toLocalIso(now()).slice(0, 10)) {
      throw badRequest('Só é possível avaliar sessões que já aconteceram.', 'session_not_held');
    }
    if (date < toLocalIso(zonedNow(new Date(plan.created_at))).slice(0, 10)) {
      throw badRequest('Essa data é anterior ao início do acompanhamento.', 'before_first_session');
    }

    const [evaluation] = await db.query(
      `INSERT INTO session_evaluations AS e (psychologist_id, employee_id, session_date, score, comment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (psychologist_id, employee_id, session_date) DO UPDATE SET
         score = excluded.score,
         comment = excluded.comment,
         updated_at = now()
       RETURNING ${EVALUATION_COLUMNS}`,
      [req.user.id, employeeId, date, score, text]
    );
    res.json({ evaluation });
  });

  router.delete('/patients/:id/evaluations/:date', async (req, res) => {
    const employeeId = v.id(req.params.id, 'Paciente');
    const date = sessionDate(req.params.date);
    await patientPlan(req.user.id, employeeId);
    await db.query(
      'DELETE FROM session_evaluations WHERE psychologist_id = $1 AND employee_id = $2 AND session_date = $3',
      [req.user.id, employeeId, date]
    );
    res.status(204).end();
  });

  return router;
};
