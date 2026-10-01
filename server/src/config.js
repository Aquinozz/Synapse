/** Business rules shared by the API. Keep in sync with the front end's src/config/pricing.ts */
export const PRICING = {
  companyPerEmployee: 200,
  sessionsPerWeek: 1,
  sessionPayout: 50,
  sessionMinutes: 50,
};

/** Scale of the score a psychologist gives to a session, and the size of the optional comment */
export const EVALUATION = { minScore: 1, maxScore: 10, commentMax: 500 };

/** Scale of the rating an employee gives to a psychologist (stars), and the size of the optional comment */
export const REVIEW = { minRating: 1, maxRating: 5, commentMax: 500 };

/**
 * Daily check-in: range of the wellness index, the index at or below which the employee's
 * psychologist is alerted, and for how many days an alert nobody marked as seen stays listed.
 */
export const CHECKIN = { minScore: 0, maxScore: 100, lowScore: 50, alertDays: 7 };

export const SESSION_FORMATS = ['video', 'audio'];
export const ROLES = ['employee', 'psychologist'];

/** Code employees of the demo company use to sign up */
export const DEMO_COMPANY_CODE = (process.env.SEED_COMPANY_CODE || 'DEMO-2026').toUpperCase();

/** One-click access to the demo accounts. Set DEMO_LOGIN=off to remove it. */
export const DEMO_LOGIN_ENABLED = process.env.DEMO_LOGIN !== 'off';

/**
 * Version of the terms of acceptance shown to users (src/legal/terms.tsx in the front end).
 * Changing the text means changing this value in both places: everyone is asked to accept again.
 */
export const TERMS_VERSION = '2026-10-01';

/** Largest profile photo accepted, in characters of its data URL (the app sends about 30 thousand) */
export const AVATAR_MAX_LENGTH = 200_000;

/** How long a login lasts */
export const TOKEN_TTL_DAYS = 7;

/** Sessions are scheduled in this time zone's wall clock, wherever the server runs */
export const APP_TIME_ZONE = process.env.APP_TIME_ZONE || 'America/Sao_Paulo';

/** Failed logins allowed per "ip|email" before a temporary block */
export const LOGIN_MAX_ATTEMPTS = 10;
export const LOGIN_WINDOW_MINUTES = 15;
