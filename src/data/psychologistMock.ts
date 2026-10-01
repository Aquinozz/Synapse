import { PRICING } from '../config/pricing';
import { SessionFormat } from '../types';
import { countWeekdayBetween, occurrenceInWeek } from '../utils/schedule';

/** A patient with a fixed weekly slot. weekday follows Date.getDay() (0 = domingo) */
export interface Patient {
  id: number;
  name: string;
  /** Profile photo chosen by the patient, when there is one */
  avatar?: string | null;
  weekday: number;
  time: string;
  format: SessionFormat;
  /** When the patient took this weekly slot */
  since: Date;
  /** This week's session, when it was moved for the week only ("YYYY-MM-DDTHH:MM") */
  rescheduledTo?: string | null;
}

/** Working days and hours offered in the agenda grid */
export const AGENDA_WEEKDAYS = [1, 2, 3, 4, 5];
export const AGENDA_TIMES = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '15:30', '16:00', '16:30', '17:00', '18:00'];

export const slotKey = (weekday: number, time: string) => `${weekday}-${time}`;

const SESSION_MS = PRICING.sessionMinutes * 60 * 1000;

/** Sessions already finished between `from` and `now`, one per patient per week */
export const countSessionsHeld = (patients: Patient[], from: Date, now: Date) => {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return patients.reduce((total, p) => {
    // Nothing is counted before the patient started
    const start = p.since.getTime() > from.getTime() ? p.since : from;
    const beforeToday = countWeekdayBetween(p.weekday, start, todayStart);
    const finishedToday =
      p.since.getTime() <= now.getTime() &&
      p.weekday === now.getDay() &&
      occurrenceInWeek(p.weekday, p.time, now).getTime() + SESSION_MS <= now.getTime();
    return total + beforeToday + (finishedToday ? 1 : 0);
  }, 0);
};

/** A private note the psychologist keeps about one patient */
export interface PatientNote {
  id: string;
  patientId: number;
  /** ISO date-time */
  createdAt: string;
  text: string;
  /** Flagged to be brought up in the next session */
  pinned: boolean;
}
