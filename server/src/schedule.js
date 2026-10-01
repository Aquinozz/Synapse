import { APP_TIME_ZONE, PRICING } from './config.js';

// Weekly session dates. Mirrors the front end's src/utils/schedule.ts.
//
// Sessions are wall-clock times ("quarta, 16:30") in the app's time zone, and the server may
// run in another zone (Vercel runs in UTC). So "now" is shifted into a Date whose local fields
// read the wall clock of APP_TIME_ZONE, and every date in this module is of that kind. They
// are only compared with each other and exchanged as "YYYY-MM-DDTHH:MM" text, never used as
// absolute instants.

const SESSION_MS = PRICING.sessionMinutes * 60 * 1000;

const wallClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** The current wall-clock time in the app's time zone */
export const zonedNow = (instant = new Date()) => {
  const parts = Object.fromEntries(wallClock.formatToParts(instant).map((p) => [p.type, Number(p.value)]));
  return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Weeks run Monday to Sunday */
export const startOfWeek = (date) => {
  const day = startOfDay(date);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return day;
};

export const endOfWeek = (date) => {
  const end = startOfWeek(date);
  end.setDate(end.getDate() + 7);
  return end;
};

/** Date of the given weekday/time inside the week that contains `reference` */
export const occurrenceInWeek = (weekday, time, reference) => {
  const [hours, minutes] = time.split(':').map(Number);
  const day = startOfWeek(reference);
  day.setDate(day.getDate() + ((weekday + 6) % 7));
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
};

/** A session still counts as "next" until it ends */
export const isOver = (start, now) => start.getTime() + SESSION_MS <= now.getTime();

/** Wall-clock date-time as "YYYY-MM-DDTHH:MM", the format stored and sent by the API */
export const toLocalIso = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** "YYYY-MM-DD" of the Monday that starts the week of `date`; identifies a week in the database */
export const weekKey = (date) => toLocalIso(startOfWeek(date)).slice(0, 10);

/** Parses "YYYY-MM-DDTHH:MM" as wall-clock time; returns null when malformed */
export const fromLocalIso = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(typeof value === 'string' ? value : '');
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  const date = new Date(y, mo - 1, d, h, mi);
  // Reject overflow such as month 13 or day 32
  return date.getMonth() === mo - 1 && date.getDate() === d && date.getHours() === h ? date : null;
};

/**
 * The session of the current week (fixed slot, or the one-off reschedule) and the next one to attend.
 * `rescheduledTo` is the Date of this week's reschedule, if any.
 */
export const describeWeek = (plan, rescheduledTo, now) => {
  const thisWeek = rescheduledTo ?? occurrenceInWeek(plan.weekday, plan.time, now);
  const doneThisWeek = isOver(thisWeek, now);
  const next = doneThisWeek ? occurrenceInWeek(plan.weekday, plan.time, endOfWeek(now)) : thisWeek;
  return { thisWeek, doneThisWeek, next };
};
