import { Router } from 'express';
import { CHECKIN } from '../config.js';
import { badRequest } from '../errors.js';
import { toLocalIso } from '../schedule.js';

/**
 * The employee's daily check-in. Only the wellness index of the day is kept, one per day:
 * doing it again replaces the day's index. A very low index is shown to the psychologist
 * who attends the employee (see /psi/alerts); the company never sees individual results.
 */
export const checkinRoutes = ({ db, now }) => {
  const router = Router();

  const today = () => toLocalIso(now()).slice(0, 10);

  router.get('/', async (req, res) => {
    const [row] = await db.query('SELECT score FROM checkins WHERE employee_id = $1 AND day = $2', [req.user.id, today()]);
    res.json({ today: row ?? null });
  });

  router.put('/', async (req, res) => {
    const score = req.body?.score;
    if (!Number.isInteger(score) || score < CHECKIN.minScore || score > CHECKIN.maxScore) {
      throw badRequest(`O índice deve ser um número inteiro de ${CHECKIN.minScore} a ${CHECKIN.maxScore}.`);
    }

    // A new answer for the day is a new result: an alert already seen comes back if it is still low
    await db.query(
      `INSERT INTO checkins (employee_id, day, score) VALUES ($1, $2, $3)
       ON CONFLICT (employee_id, day) DO UPDATE SET score = excluded.score, updated_at = now(), alert_seen_at = NULL`,
      [req.user.id, today(), score]
    );

    const [psychologist] = await db.query(
      `SELECT u.name FROM weekly_plans w JOIN users u ON u.id = w.psychologist_id WHERE w.employee_id = $1`,
      [req.user.id]
    );
    const alerted = score <= CHECKIN.lowScore && psychologist !== undefined;
    res.json({ today: { score }, alerted, psychologistName: alerted ? psychologist.name : null });
  });

  return router;
};
