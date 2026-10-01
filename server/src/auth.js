import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MINUTES, TOKEN_TTL_DAYS } from './config.js';
import { forbidden, unauthorized } from './errors.js';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

/** scrypt hash stored as "salt:hash" (hex) */
export const hashPassword = async (password) => {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
};

export const verifyPassword = async (password, stored) => {
  const [saltHex, hashHex] = stored.split(':');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), KEY_LENGTH);
  return timingSafeEqual(expected, actual);
};

// Checked when the e-mail does not exist, so a login attempt takes the same time either way
const dummyHash = hashPassword(randomBytes(16).toString('hex'));
export const verifyAgainstDummy = async (password) => verifyPassword(password, await dummyHash);

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

/** Creates a login token for the user and returns it. Only its hash is stored. */
export const issueToken = async (db, userId) => {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.query('INSERT INTO auth_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [
    hashToken(token),
    userId,
    expiresAt,
  ]);
  return token;
};

export const revokeToken = (db, token) =>
  db.query('DELETE FROM auth_tokens WHERE token_hash = $1', [hashToken(token)]);

const bearerToken = (req) => {
  const header = req.get('authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
};

/** Requires a valid token and puts the user on `req.user` (and the raw token on `req.token`) */
export const requireAuth = (db) => async (req, res, next) => {
  const token = bearerToken(req);
  if (!token) throw unauthorized();

  const [user] = await db.query(
    `SELECT u.id, u.role, u.name, u.email, u.company_id AS "companyId"
       FROM auth_tokens t JOIN users u ON u.id = t.user_id
      WHERE t.token_hash = $1 AND t.expires_at > now()`,
    [hashToken(token)]
  );
  if (!user) throw unauthorized('Sua sessão expirou. Faça login novamente.');

  req.user = user;
  req.token = token;
  next();
};

export const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) throw forbidden();
  next();
};

/**
 * Counts failed logins per key in the database (serverless instances share no memory)
 * and blocks after too many inside the time window.
 */
export const createLoginLimiter = (db) => {
  const window = `${LOGIN_WINDOW_MINUTES} minutes`;
  return {
    async isBlocked(key) {
      const [row] = await db.query(
        `SELECT count FROM login_attempts WHERE key = $1 AND first_at > now() - $2::interval`,
        [key, window]
      );
      return row !== undefined && row.count >= LOGIN_MAX_ATTEMPTS;
    },
    fail: (key) =>
      // Starts a new window when the previous one has expired
      db.query(
        `INSERT INTO login_attempts (key) VALUES ($1)
         ON CONFLICT (key) DO UPDATE SET
           count = CASE WHEN login_attempts.first_at > now() - $2::interval THEN login_attempts.count + 1 ELSE 1 END,
           first_at = CASE WHEN login_attempts.first_at > now() - $2::interval THEN login_attempts.first_at ELSE now() END`,
        [key, window]
      ),
    reset: (key) => db.query('DELETE FROM login_attempts WHERE key = $1', [key]),
  };
};
