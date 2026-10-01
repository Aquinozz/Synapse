import { Router } from 'express';
import {
  hashPassword,
  issueToken,
  revokeToken,
  verifyAgainstDummy,
  verifyPassword,
} from '../auth.js';
import { randomBytes } from 'node:crypto';
import { DEMO_COMPANY_CODE, ROLES } from '../config.js';
import { DEMO_ACCOUNTS, seed } from '../seed.js';
import { UNIQUE_VIOLATION } from '../db.js';
import { HttpError, badRequest, conflict, notFound } from '../errors.js';
import * as v from '../validate.js';

/** What the client is allowed to know about the signed-in user */
export const publicUser = async (db, userId) => {
  const [user] = await db.query(
    `SELECT u.id, u.role, u.name, u.email, c.name AS "companyName", p.status
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       LEFT JOIN psychologists p ON p.user_id = u.id
      WHERE u.id = $1`,
    [userId]
  );
  const { companyName, status, ...base } = user;
  return user.role === 'psychologist' ? { ...base, status } : { ...base, companyName };
};

export const authRoutes = ({ db, requireAuth, loginLimiter, demoLogin }) => {
  const router = Router();

  // The demo data is created the first time someone asks for demo access on this instance
  let demoReady = null;
  const ensureDemoData = () => {
    demoReady ??= seed(db, {
      // Without SEED_PASSWORD the demo accounts get a random password: they can only be
      // entered through this endpoint
      password: process.env.SEED_PASSWORD || randomBytes(24).toString('base64url'),
      companyCode: DEMO_COMPANY_CODE,
    }).catch((err) => {
      demoReady = null;
      throw err;
    });
    return demoReady;
  };

  // One-click access to a demo account, with no password
  router.post('/demo', async (req, res) => {
    if (!demoLogin) throw notFound('Rota não encontrada.');
    const email = DEMO_ACCOUNTS[req.body?.account];
    if (!email) throw badRequest('Conta de demonstração inválida.');

    await ensureDemoData();
    const [user] = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    res.json({ token: await issueToken(db, user.id), user: await publicUser(db, user.id) });
  });

  router.post('/register', async (req, res) => {
    const body = req.body ?? {};
    const role = v.oneOf(body.role, ROLES, 'Perfil');
    const name = v.text(body.name, 'o nome', { max: 120 });
    const email = v.email(body.email);
    const password = v.password(body.password);

    // Role-specific fields are validated before anything is written
    let companyId = null;
    let professional = null;
    if (role === 'employee') {
      const code = v.text(body.companyCode, 'o código da empresa', { max: 40 }).toUpperCase();
      const [company] = await db.query('SELECT id FROM companies WHERE access_code = $1', [code]);
      if (!company) throw badRequest('Código da empresa não encontrado.', 'unknown_company_code');
      companyId = company.id;
    } else {
      professional = {
        reg: v.text(body.reg, 'o registro profissional (CRP)', { max: 40 }),
        title: v.text(body.title, 'a especialidade', { max: 120 }),
      };
    }

    const passwordHash = await hashPassword(password);

    let userId;
    try {
      userId = await db.transaction(async (q) => {
        if ((await q.query('SELECT 1 FROM users WHERE email = $1', [email])).length > 0) {
          throw conflict('Já existe uma conta com este e-mail.', 'email_taken');
        }
        if (professional && (await q.query('SELECT 1 FROM psychologists WHERE reg = $1', [professional.reg])).length > 0) {
          throw conflict('Este registro profissional já está cadastrado.', 'reg_taken');
        }

        const [{ id }] = await q.query(
          'INSERT INTO users (role, name, email, password_hash, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [role, name, email, passwordHash, companyId]
        );

        if (professional) {
          // New professionals start as 'pending' until the registration is checked
          await q.query('INSERT INTO psychologists (user_id, title, reg) VALUES ($1, $2, $3)', [
            id,
            professional.title,
            professional.reg,
          ]);
        }
        return id;
      });
    } catch (err) {
      // Two sign-ups with the same e-mail or registration at the same moment
      if (err.code === UNIQUE_VIOLATION) {
        throw conflict('Já existe uma conta com estes dados.', 'email_taken');
      }
      throw err;
    }

    res.status(201).json({ token: await issueToken(db, userId), user: await publicUser(db, userId) });
  });

  router.post('/login', async (req, res) => {
    const body = req.body ?? {};
    const email = v.email(body.email);
    if (typeof body.password !== 'string') throw badRequest('Informe a senha.');

    const limiterKey = `${req.ip}|${email}`;
    if (await loginLimiter.isBlocked(limiterKey)) {
      throw new HttpError(429, 'too_many_attempts', 'Muitas tentativas. Aguarde alguns minutos e tente de novo.');
    }

    const [user] = await db.query('SELECT id, password_hash AS "passwordHash" FROM users WHERE email = $1', [email]);
    // Same message and similar timing whether the e-mail exists or not
    const ok = user ? await verifyPassword(body.password, user.passwordHash) : await verifyAgainstDummy(body.password);
    if (!user || !ok) {
      await loginLimiter.fail(limiterKey);
      throw new HttpError(401, 'invalid_credentials', 'E-mail ou senha incorretos.');
    }

    await loginLimiter.reset(limiterKey);
    res.json({ token: await issueToken(db, user.id), user: await publicUser(db, user.id) });
  });

  router.post('/logout', requireAuth, async (req, res) => {
    await revokeToken(db, req.token);
    res.status(204).end();
  });

  router.get('/me', requireAuth, async (req, res) => {
    res.json({ user: await publicUser(db, req.user.id) });
  });

  return router;
};
