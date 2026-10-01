import { useEffect, useState } from 'react';
import { PRICING } from '../config/pricing';
import { Therapist, WeeklyPlan } from '../types';

/** Indexed like Date.getDay(): 0 = domingo */
export const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const SESSION_MS = PRICING.sessionMinutes * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Weeks run Monday to Sunday */
export const startOfWeek = (date: Date) => {
  const day = startOfDay(date);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return day;
};

export const endOfWeek = (date: Date) => {
  const end = startOfWeek(date);
  end.setDate(end.getDate() + 7);
  return end;
};

const atTime = (day: Date, time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
};

/** Date of the given weekday/time inside the week that contains `reference` */
export const occurrenceInWeek = (weekday: number, time: string, reference: Date) => {
  const day = startOfWeek(reference);
  day.setDate(day.getDate() + ((weekday + 6) % 7));
  return atTime(day, time);
};

/** A session still counts as "next" until it ends */
const isOver = (start: Date, now: Date) => start.getTime() + SESSION_MS <= now.getTime();

/** Next time the weekly slot happens, counting one that is in progress */
export const nextOccurrence = (weekday: number, time: string, from: Date = new Date()) => {
  const thisWeek = occurrenceInWeek(weekday, time, from);
  return isOver(thisWeek, from) ? new Date(thisWeek.getTime() + 7 * DAY_MS) : thisWeek;
};

/** The session the employee has this week: the fixed slot, or the one-off reschedule */
export const sessionOfWeek = (plan: WeeklyPlan, now: Date = new Date()) => {
  if (plan.rescheduledTo) {
    const moved = new Date(plan.rescheduledTo);
    if (startOfWeek(moved).getTime() === startOfWeek(now).getTime()) return moved;
  }
  return occurrenceInWeek(plan.weekday, plan.time, now);
};

export const nextSession = (plan: WeeklyPlan, now: Date = new Date()) => {
  const thisWeek = sessionOfWeek(plan, now);
  if (!isOver(thisWeek, now)) return thisWeek;
  // This week's session is done: the next one is the fixed slot of the following week
  return occurrenceInWeek(plan.weekday, plan.time, endOfWeek(now));
};

export const isSessionDoneThisWeek = (plan: WeeklyPlan, now: Date = new Date()) =>
  isOver(sessionOfWeek(plan, now), now);

export const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

export const formatTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/** "Hoje", "Amanhã", the weekday for the next few days, or the date */
export const formatDay = (date: Date, now: Date = new Date()) => {
  const days = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  if (days > 1 && days < 7) return WEEKDAYS[date.getDay()];
  return `${WEEKDAYS_SHORT[date.getDay()]} ${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
};

export const formatDayTime = (date: Date, now: Date = new Date()) =>
  `${formatDay(date, now)}, ${formatTime(date)}`;

/** "agora", "em 42 min", "em 1h 42m", "em 3 dias" */
export const formatCountdown = (date: Date, now: Date = new Date()) => {
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return 'agora';
  const minutes = Math.round(diff / 60000);
  if (minutes < 60) return `em ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `em ${hours}h ${String(minutes % 60).padStart(2, '0')}m`;
  const days = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
  return days === 1 ? 'amanhã' : `em ${days} dias`;
};

/** "Toda quarta, 16:30" */
export const formatRecurring = (weekday: number, time: string) => {
  const name = WEEKDAYS[weekday].toLowerCase();
  // "Sábado" and "domingo" are masculine
  const every = weekday === 0 || weekday === 6 ? 'Todo' : 'Toda';
  return `${every} ${name}, ${time}`;
};

/** Concrete upcoming dates from a therapist's weekly availability, soonest first */
export const upcomingSlots = (therapist: Therapist, now: Date = new Date(), until?: Date) => {
  const slots = therapist.weeklyAvailability.flatMap(({ weekday, times }) =>
    times.map((time) => {
      const thisWeek = occurrenceInWeek(weekday, time, now);
      // A slot that already started cannot be booked
      return thisWeek.getTime() > now.getTime() ? thisWeek : new Date(thisWeek.getTime() + 7 * DAY_MS);
    })
  );
  return slots
    .filter((slot) => !until || slot.getTime() < until.getTime())
    .sort((a, b) => a.getTime() - b.getTime());
};

/** Local date-time as "YYYY-MM-DDTHH:MM", the format the API stores and expects */
export const toLocalIso = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${formatTime(date)}`;
};

/** Current time, refreshed so countdowns and "today" labels stay correct */
export const useNow = (intervalMs = 30000) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
};

/** How many times a weekday falls between two dates (start inclusive, end exclusive) */
export const countWeekdayBetween = (weekday: number, from: Date, to: Date) => {
  let count = 0;
  for (const day = startOfDay(from); day.getTime() < to.getTime(); day.setDate(day.getDate() + 1)) {
    if (day.getDay() === weekday) count++;
  }
  return count;
};

export const startOfMonth = (date: Date, offset = 0) => new Date(date.getFullYear(), date.getMonth() + offset, 1);
