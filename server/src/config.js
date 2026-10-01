/** Business rules shared by the API. Keep in sync with the front end's src/config/pricing.ts */
export const PRICING = {
  companyPerEmployee: 100,
  psychologistMonthly: 80,
  sessionsPerWeek: 1,
  /** PROVISIONAL: the per-session payout has not been defined by the business yet */
  sessionPayout: 40,
  sessionMinutes: 50,
};

export const SESSION_FORMATS = ['video', 'audio'];
export const ROLES = ['employee', 'psychologist'];

/** Code employees of the demo company use to sign up */
export const DEMO_COMPANY_CODE = (process.env.SEED_COMPANY_CODE || 'DEMO-2026').toUpperCase();

/** One-click access to the demo accounts. Set DEMO_LOGIN=off to remove it. */
export const DEMO_LOGIN_ENABLED = process.env.DEMO_LOGIN !== 'off';

/** How long a login lasts */
export const TOKEN_TTL_DAYS = 7;

/** Sessions are scheduled in this time zone's wall clock, wherever the server runs */
export const APP_TIME_ZONE = process.env.APP_TIME_ZONE || 'America/Sao_Paulo';

/** Failed logins allowed per "ip|email" before a temporary block */
export const LOGIN_MAX_ATTEMPTS = 10;
export const LOGIN_WINDOW_MINUTES = 15;
