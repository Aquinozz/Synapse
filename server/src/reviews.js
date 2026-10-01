// What employees say about a psychologist: a rating from 1 to 5 stars and an optional comment.
// Reviews are published without the author's name.
// Every function takes `q`, the database or an open transaction.

import { REVIEW } from './config.js';
import { isOver, occurrenceInWeek, toLocalIso, zonedNow } from './schedule.js';

const STARS = Array.from({ length: REVIEW.maxRating - REVIEW.minRating + 1 }, (_, i) => REVIEW.minRating + i);

/** Most recent reviews sent in one answer */
const MAX_LISTED = 50;

/**
 * Whether the employee may review the psychologist: only their current psychologist, and only
 * after the first session. Sessions are not recorded one by one, so the first session is the
 * first occurrence of the fixed weekly slot since the employee took it.
 */
export const reviewEligibility = async (q, employeeId, psychologistId, now) => {
  const [plan] = await q.query(
    'SELECT weekday, time, created_at FROM weekly_plans WHERE employee_id = $1 AND psychologist_id = $2',
    [employeeId, psychologistId]
  );
  if (!plan) return { canReview: false, reason: 'not_your_psychologist' };

  const since = zonedNow(new Date(plan.created_at));
  const firstDay = new Date(since.getFullYear(), since.getMonth(), since.getDate());
  let first = occurrenceInWeek(plan.weekday, plan.time, since);
  if (first.getTime() < firstDay.getTime()) first = new Date(first.getFullYear(), first.getMonth(), first.getDate() + 7, first.getHours(), first.getMinutes());
  return isOver(first, now) ? { canReview: true, reason: null } : { canReview: false, reason: 'no_session_yet' };
};

/** The reviews of a psychologist, newest first, with the totals. `viewerId` marks the viewer's own review. */
export const listReviews = async (q, psychologistId, viewerId = null) => {
  const rows = await q.query(
    `SELECT id, rating, comment, updated_at, employee_id
       FROM reviews
      WHERE psychologist_id = $1
      ORDER BY updated_at DESC, id DESC`,
    [psychologistId]
  );

  const count = rows.length;
  const average = count === 0 ? 0 : Math.round((rows.reduce((sum, row) => sum + row.rating, 0) / count) * 10) / 10;
  const distribution = Object.fromEntries(STARS.map((stars) => [stars, rows.filter((row) => row.rating === stars).length]));

  const reviews = rows.slice(0, MAX_LISTED).map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    date: toLocalIso(zonedNow(new Date(row.updated_at))).slice(0, 10),
    // The author is never sent; the viewer only learns which review is their own
    mine: viewerId !== null && row.employee_id === viewerId,
  }));

  return { summary: { average, count, distribution }, reviews };
};
