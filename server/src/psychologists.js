// Queries about psychologists shared by more than one route.
// Every function takes `q`, the database or an open transaction.

export const groupByWeekday = (slots) => {
  const byDay = new Map();
  for (const { weekday, time } of slots) {
    byDay.set(weekday, [...(byDay.get(weekday) ?? []), time]);
  }
  return [...byDay.entries()].map(([weekday, times]) => ({ weekday, times }));
};

/**
 * Public profile as employees see it. `weeklyAvailability` lists only slots nobody holds,
 * plus the slot held by `viewerId` (so employees see their own fixed slot as selectable).
 */
export const getPublicProfile = async (q, psychologistId, viewerId = null, { includePending = false } = {}) => {
  const [row] = await q.query(
    `SELECT p.user_id AS id, u.name, p.title, p.reg, p.bio, p.avatar_url AS avatar, p.badge,
            COALESCE(ROUND(r.average, 1), 0)::float8 AS rating, COALESCE(r.count, 0)::int AS "reviewCount",
            p.status, p.specialties, p.approaches, p.languages
       FROM psychologists p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN (SELECT psychologist_id, AVG(rating) AS average, COUNT(*) AS count FROM reviews GROUP BY psychologist_id) r
         ON r.psychologist_id = p.user_id
      WHERE p.user_id = $1`,
    [psychologistId]
  );
  if (!row || (row.status !== 'active' && !includePending)) return null;
  const { status, ...profile } = row;

  const freeSlots = await q.query(
    `SELECT a.weekday, a.time
       FROM availability a
       LEFT JOIN weekly_plans w
         ON w.psychologist_id = a.psychologist_id AND w.weekday = a.weekday AND w.time = a.time
      WHERE a.psychologist_id = $1 AND (w.employee_id IS NULL OR w.employee_id = $2)
      ORDER BY a.weekday, a.time`,
    [psychologistId, viewerId]
  );

  return {
    ...profile,
    // Only the owner needs to know the review status
    ...(includePending && { status }),
    weeklyAvailability: groupByWeekday(freeSlots),
  };
};

export const listPublicProfiles = async (q, viewerId, search = '') => {
  const term = `%${search.toLowerCase()}%`;
  const ids = await q.query(
    `SELECT p.user_id AS id
       FROM psychologists p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN (SELECT psychologist_id, AVG(rating) AS average FROM reviews GROUP BY psychologist_id) r
         ON r.psychologist_id = p.user_id
      WHERE p.status = 'active'
        AND (lower(u.name) LIKE $1 OR lower(p.title) LIKE $1 OR lower(p.bio) LIKE $1
             OR lower(array_to_string(p.specialties || p.approaches, ' ')) LIKE $1)
      ORDER BY r.average DESC NULLS LAST, u.name`,
    [term]
  );
  const profiles = [];
  for (const { id } of ids) profiles.push(await getPublicProfile(q, id, viewerId));
  return profiles;
};
