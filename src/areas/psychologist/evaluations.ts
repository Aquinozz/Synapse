import { PRICING } from '../../config/pricing';
import { Patient } from '../../data/psychologistMock';
import { occurrenceInWeek } from '../../utils/schedule';

/** A patient whose daily check-in came out very low, until the psychologist marks it as seen */
export interface CheckinAlert {
  patientId: number;
  name: string;
  avatar: string | null;
  /** Day of the check-in, YYYY-MM-DD */
  day: string;
  /** Wellness index, 0 to 100 */
  score: number;
}

/** The score a psychologist gave to one session with a patient */
export interface Evaluation {
  patientId: number;
  /** Day of the session, YYYY-MM-DD */
  date: string;
  score: number;
  comment: string;
}

/** Scale of the score and size of the comment. Keep in sync with the API's server/src/config.js */
export const EVALUATION = { minScore: 1, maxScore: 10, commentMax: 500 } as const;

export const SCORES = Array.from(
  { length: EVALUATION.maxScore - EVALUATION.minScore + 1 },
  (_, index) => EVALUATION.minScore + index
);

const SESSION_MS = PRICING.sessionMinutes * 60 * 1000;
// Far enough back for any follow-up; only bounds the loop
const MAX_WEEKS = 520;

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const fromDayKey = (day: string) => {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
};

/** "qua., 23/09" */
export const formatSessionDay = (day: string) =>
  fromDayKey(day).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });

/** "23/09" */
export const formatShortDay = (day: string) =>
  fromDayKey(day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

/**
 * Days of the sessions the patient already had, newest first. The API keeps no record of each
 * session, so they are laid out from the fixed weekly slot since the patient took it; this
 * week's session follows a one-off reschedule when there is one.
 */
export const sessionsHeld = (patient: Patient, now: Date): string[] => {
  const firstDay = new Date(patient.since.getFullYear(), patient.since.getMonth(), patient.since.getDate());
  const days: string[] = [];
  for (let weeksAgo = 0; weeksAgo < MAX_WEEKS; weeksAgo++) {
    const reference = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7 * weeksAgo);
    const start =
      weeksAgo === 0 && patient.rescheduledTo
        ? new Date(patient.rescheduledTo)
        : occurrenceInWeek(patient.weekday, patient.time, reference);
    if (start.getTime() < firstDay.getTime()) break;
    if (start.getTime() + SESSION_MS <= now.getTime()) days.push(dayKey(start));
  }
  return days;
};

/** Evaluations of one patient, oldest first */
export const evaluationsOf = (evaluations: Evaluation[], patientId: number) =>
  evaluations.filter((evaluation) => evaluation.patientId === patientId).sort((a, b) => a.date.localeCompare(b.date));

/** Finished sessions still without a score, newest first */
export const pendingSessions = (patient: Patient, evaluations: Evaluation[], now: Date) => {
  const scored = new Set(evaluationsOf(evaluations, patient.id).map((evaluation) => evaluation.date));
  return sessionsHeld(patient, now).filter((day) => !scored.has(day));
};

/** How far back an unscored session still shows up as something to do */
const REMINDER_DAYS = 28;

/** Sessions of the last weeks waiting for a score, across all patients, newest first */
export const sessionsToEvaluate = (patients: Patient[], evaluations: Evaluation[], now: Date) => {
  const oldest = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - REMINDER_DAYS));
  return patients
    .flatMap((patient) =>
      pendingSessions(patient, evaluations, now)
        .filter((day) => day >= oldest)
        .map((day) => ({ patient, day }))
    )
    .sort((a, b) => b.day.localeCompare(a.day));
};
