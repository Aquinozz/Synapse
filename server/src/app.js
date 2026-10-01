import express from 'express';
import { createLoginLimiter, requireAuth, requireRole } from './auth.js';
import { DEMO_LOGIN_ENABLED, PRICING } from './config.js';
import { errorHandler, notFound } from './errors.js';
import { authRoutes } from './routes/auth.js';
import { planRoutes } from './routes/plan.js';
import { psiRoutes } from './routes/psi.js';
import { psychologistRoutes } from './routes/psychologists.js';
import { zonedNow } from './schedule.js';

/**
 * Builds the API on top of an open database.
 * `now` returns the wall-clock time in the app's time zone; tests inject it to pin the clock.
 * `demoLogin` turns the one-click demo access on or off.
 */
export const createApp = (db, { now = zonedNow, demoLogin = DEMO_LOGIN_ENABLED } = {}) => {
  const app = express();
  app.disable('x-powered-by');
  // Behind Vercel's proxy the client address comes in X-Forwarded-For
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '100kb' }));

  const auth = requireAuth(db);
  const deps = { db, now, demoLogin, requireAuth: auth, loginLimiter: createLoginLimiter(db) };

  const api = express.Router();
  api.get('/health', (req, res) => res.json({ status: 'ok' }));
  api.get('/pricing', (req, res) => res.json({ pricing: PRICING }));
  api.use('/auth', authRoutes(deps));
  api.use('/psychologists', auth, psychologistRoutes(deps));
  api.use('/plan', auth, requireRole('employee'), planRoutes(deps));
  api.use('/psi', auth, requireRole('psychologist'), psiRoutes(deps));
  api.use(() => {
    throw notFound('Rota não encontrada.');
  });

  app.use('/api', api);
  app.use(errorHandler);
  return app;
};
