// The daily check-in opens by itself once a day. Skipping it is remembered for the day, in this browser.

const skipKey = (userId: number) => `synapse:checkin-skipped:${userId}`;

const today = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const skipCheckinToday = (userId: number) => {
  try {
    localStorage.setItem(skipKey(userId), today());
  } catch {
    // Storage unavailable: the check-in opens again on the next visit
  }
};

export const hasSkippedCheckinToday = (userId: number) => {
  try {
    return localStorage.getItem(skipKey(userId)) === today();
  } catch {
    return false;
  }
};

/** What the API answers when the check-in of the day is saved */
export interface CheckinResult {
  today: { score: number };
  /** The index was very low and the person's psychologist was told */
  alerted: boolean;
  psychologistName: string | null;
}
