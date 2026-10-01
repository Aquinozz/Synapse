// Postgres access. In production (and whenever DATABASE_URL is set) it talks to a real
// server through `pg`. Without DATABASE_URL it runs PGlite, a full Postgres embedded in
// the Node process, so local development and tests need no database installed.

import pg from 'pg';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS companies (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT NOT NULL,
  -- Employees type this code when signing up, which links them to the paying company
  access_code TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role          TEXT NOT NULL CHECK (role IN ('employee', 'psychologist')),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  company_id    INTEGER REFERENCES companies(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Employees belong to a company; psychologists do not
  CHECK ((role = 'employee') = (company_id IS NOT NULL))
);

-- Acceptance of the terms (LGPD): which version was accepted and when. Employees also give
-- a separate, explicit consent to the processing of health data (LGPD art. 11, I).
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS health_consent_at TIMESTAMPTZ;

-- Profile photo of an employee, already cropped and reduced by the app, as a data URL
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;

CREATE TABLE IF NOT EXISTS auth_tokens (
  -- SHA-256 of the bearer token, so a leaked database does not leak sessions
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Failed logins per "ip|email", to slow down password guessing
CREATE TABLE IF NOT EXISTS login_attempts (
  key      TEXT PRIMARY KEY,
  first_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  count    INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS psychologists (
  user_id      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  -- Professional registration (CRP/CRM)
  reg          TEXT NOT NULL UNIQUE,
  bio          TEXT NOT NULL DEFAULT '',
  avatar_url   TEXT,
  badge        TEXT,
  -- No longer read: the rating and the number of reviews come from the reviews table
  rating       REAL NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  -- Only 'active' profiles (registration checked) are shown to employees
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active'))
);

CREATE TABLE IF NOT EXISTS psychologist_tags (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  psychologist_id INTEGER NOT NULL REFERENCES psychologists(user_id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  icon            TEXT NOT NULL,
  category        TEXT,
  UNIQUE (psychologist_id, label)
);

-- What the profile lists and the directory filters by (the options are in src/catalog.js).
-- psychologist_tags is the older, free-form version of specialties and is no longer written.
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS specialties TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS approaches TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE psychologists ADD COLUMN IF NOT EXISTS languages TEXT[] NOT NULL DEFAULT '{}';

-- Profiles saved before these columns existed keep their specialties
UPDATE psychologists p
   SET specialties = (SELECT array_agg(t.label ORDER BY t.id) FROM psychologist_tags t WHERE t.psychologist_id = p.user_id)
 WHERE cardinality(p.specialties) = 0
   AND EXISTS (SELECT 1 FROM psychologist_tags t WHERE t.psychologist_id = p.user_id);

-- Weekly slots a psychologist offers. weekday follows JavaScript's Date.getDay(): 0 = Sunday
CREATE TABLE IF NOT EXISTS availability (
  psychologist_id INTEGER NOT NULL REFERENCES psychologists(user_id) ON DELETE CASCADE,
  weekday         INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  time            TEXT NOT NULL,
  PRIMARY KEY (psychologist_id, weekday, time)
);

-- One fixed weekly session per employee; a slot is held by at most one employee
CREATE TABLE IF NOT EXISTS weekly_plans (
  employee_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  psychologist_id INTEGER NOT NULL,
  weekday         INTEGER NOT NULL,
  time            TEXT NOT NULL,
  format          TEXT NOT NULL CHECK (format IN ('video', 'audio')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (psychologist_id, weekday, time),
  FOREIGN KEY (psychologist_id, weekday, time) REFERENCES availability(psychologist_id, weekday, time)
);

-- A session moved for a single week. week_start is the Monday of that week (YYYY-MM-DD).
-- Dates here are wall-clock text in the app's time zone, not instants.
CREATE TABLE IF NOT EXISTS reschedules (
  employee_id     INTEGER NOT NULL REFERENCES weekly_plans(employee_id) ON DELETE CASCADE,
  week_start      TEXT NOT NULL,
  psychologist_id INTEGER NOT NULL,
  -- YYYY-MM-DDTHH:MM
  starts_at       TEXT NOT NULL,
  PRIMARY KEY (employee_id, week_start),
  UNIQUE (psychologist_id, starts_at)
);

-- Wellness index of the employee's daily check-in, one per day (YYYY-MM-DD, wall-clock text).
-- A very low index is an alert for the employee's psychologist until marked as seen.
CREATE TABLE IF NOT EXISTS checkins (
  employee_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day           TEXT NOT NULL,
  score         INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  alert_seen_at TIMESTAMPTZ,
  PRIMARY KEY (employee_id, day)
);

-- What employees say about a psychologist. Shown without the author's name. One review per
-- employee per psychologist; the demo samples have no author.
CREATE TABLE IF NOT EXISTS reviews (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  psychologist_id INTEGER NOT NULL REFERENCES psychologists(user_id) ON DELETE CASCADE,
  employee_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (psychologist_id, employee_id)
);

-- The score a psychologist gives to each session with a patient, to follow the patient's
-- progress over time. Health data: only that psychologist ever reads it.
CREATE TABLE IF NOT EXISTS session_evaluations (
  psychologist_id INTEGER NOT NULL REFERENCES psychologists(user_id) ON DELETE CASCADE,
  employee_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Day of the session, YYYY-MM-DD (wall-clock text, like the other dates)
  session_date    TEXT NOT NULL,
  score           INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
  comment         TEXT NOT NULL DEFAULT '',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (psychologist_id, employee_id, session_date)
);
`;

/** Postgres error codes the routes translate into friendly answers */
export const UNIQUE_VIOLATION = '23505';
export const FOREIGN_KEY_VIOLATION = '23503';

// Both drivers answer `{ rows }`; routes only ever need the rows
const queryable = (runner) => ({
  query: async (text, params = []) => (await runner.query(text, params)).rows,
});

const connectPostgres = async (connectionString) => {
  const pool = new pg.Pool({
    connectionString,
    // Serverless instances each open their own pool; keep it small
    max: Number(process.env.PG_POOL_MAX) || 3,
  });
  return {
    ...queryable(pool),
    exec: (sql) => pool.query(sql),
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn(queryable(client));
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
};

const connectEmbedded = async (dataDir) => {
  const { PGlite } = await import('@electric-sql/pglite');
  const pglite = dataDir ? new PGlite(dataDir) : new PGlite();
  return {
    ...queryable(pglite),
    exec: (sql) => pglite.exec(sql),
    // PGlite rolls back by itself when the callback throws
    transaction: (fn) => pglite.transaction((tx) => fn(queryable(tx))),
    close: () => pglite.close(),
  };
};

/**
 * Opens the database and makes sure the tables exist.
 * - `postgres://...` connects to a Postgres server.
 * - a directory path runs the embedded Postgres with its files there.
 * - nothing (or 'memory') runs it in memory, for tests.
 *
 * The result has `query(text, params)` (resolves to the rows), `transaction(fn)`
 * (calls `fn` with a queryable bound to one transaction) and `close()`.
 */
export const openDatabase = async (target) => {
  const isServer = typeof target === 'string' && /^postgres(ql)?:\/\//.test(target);
  const db = isServer
    ? await connectPostgres(target)
    : await connectEmbedded(target && target !== 'memory' ? target : null);
  await db.exec(SCHEMA);
  return db;
};
