import { Router } from 'express';
import { notFound } from '../errors.js';
import { getPublicProfile, listPublicProfiles } from '../psychologists.js';
import * as v from '../validate.js';

/** Directory of psychologists, as seen by signed-in users */
export const psychologistRoutes = ({ db }) => {
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

  return router;
};
