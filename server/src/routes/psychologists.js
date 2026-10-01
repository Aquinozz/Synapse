import { Router } from 'express';
import { REVIEW } from '../config.js';
import { badRequest, forbidden, notFound } from '../errors.js';
import { getPublicProfile, listPublicProfiles } from '../psychologists.js';
import { listReviews, reviewEligibility } from '../reviews.js';
import * as v from '../validate.js';

const REVIEW_REFUSALS = {
  not_your_psychologist: 'Você só pode avaliar o psicólogo que atende você.',
  no_session_yet: 'Você poderá avaliar depois da primeira sessão.',
};

/** Directory of psychologists, as seen by signed-in users */
export const psychologistRoutes = ({ db, now }) => {
  const router = Router();

  router.get('/', async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 80) : '';
    res.json({ psychologists: await listPublicProfiles(db, req.user.id, search) });
  });

  router.get('/:id', async (req, res) => {
    const profile = await getPublicProfile(db, v.id(req.params.id), req.user.id);
    if (!profile) throw notFound('Psicólogo não encontrado.');
    res.json({ psychologist: profile });
  });

  // ---- Reviews: what employees say about the psychologist, published without their names

  const activeProfileId = async (value) => {
    const id = v.id(value);
    const [row] = await db.query("SELECT 1 FROM psychologists WHERE user_id = $1 AND status = 'active'", [id]);
    if (!row) throw notFound('Psicólogo não encontrado.');
    return id;
  };

  const reviewsFor = async (psychologistId, user) => {
    const listing = await listReviews(db, psychologistId, user.id);
    const eligibility =
      user.role === 'employee'
        ? await reviewEligibility(db, user.id, psychologistId, now())
        : { canReview: false, reason: 'not_your_psychologist' };
    return { ...listing, ...eligibility };
  };

  router.get('/:id/reviews', async (req, res) => {
    res.json(await reviewsFor(await activeProfileId(req.params.id), req.user));
  });

  // Gives or changes the viewer's own review
  router.put('/:id/review', async (req, res) => {
    if (req.user.role !== 'employee') throw forbidden();
    const psychologistId = await activeProfileId(req.params.id);
    const { rating, comment = '' } = req.body ?? {};
    if (!Number.isInteger(rating) || rating < REVIEW.minRating || rating > REVIEW.maxRating) {
      throw badRequest(`Dê uma nota de ${REVIEW.minRating} a ${REVIEW.maxRating} estrelas.`);
    }
    if (typeof comment !== 'string') throw badRequest('Comentário inválido.');
    const text = comment.trim();
    if (text.length > REVIEW.commentMax) {
      throw badRequest(`O comentário deve ter no máximo ${REVIEW.commentMax} caracteres.`);
    }

    const { canReview, reason } = await reviewEligibility(db, req.user.id, psychologistId, now());
    if (!canReview) throw forbidden(REVIEW_REFUSALS[reason]);

    await db.query(
      `INSERT INTO reviews (psychologist_id, employee_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (psychologist_id, employee_id) DO UPDATE SET
         rating = excluded.rating,
         comment = excluded.comment,
         updated_at = now()`,
      [psychologistId, req.user.id, rating, text]
    );
    res.json(await reviewsFor(psychologistId, req.user));
  });

  // Removes the viewer's own review; allowed even after switching psychologist
  router.delete('/:id/review', async (req, res) => {
    const psychologistId = await activeProfileId(req.params.id);
    await db.query('DELETE FROM reviews WHERE psychologist_id = $1 AND employee_id = $2', [psychologistId, req.user.id]);
    res.json(await reviewsFor(psychologistId, req.user));
  });

  return router;
};
