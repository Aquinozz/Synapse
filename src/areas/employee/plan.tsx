import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, errorMessage } from '../../api/client';
import { LoadingScreen } from '../../components/LoadingScreen';
import { SessionFormat, Therapist, WeeklyPlan } from '../../types';
import { isSessionDoneThisWeek, nextSession, toLocalIso, useNow } from '../../utils/schedule';

interface EmployeePlanValue {
  /** Null until the employee chooses a psychologist and a weekly slot */
  plan: WeeklyPlan | null;
  /** The employee's fixed therapist */
  therapist: Therapist | null;
  /** Start of the next session */
  next: Date | null;
  /** This week's session already happened */
  doneThisWeek: boolean;
  now: Date;
  /** Directory of psychologists with their free weekly slots */
  therapists: Therapist[];
  /** Sets (or changes) the fixed therapist and weekly slot. Rejects with an ApiError. */
  choose: (therapistId: number, weekday: number, time: string, format: SessionFormat) => Promise<void>;
  /** Moves only this week's session. Rejects with an ApiError. */
  reschedule: (date: Date) => Promise<void>;
  /** Reloads the directory, e.g. after a slot turned out to be taken */
  refreshTherapists: () => Promise<void>;
}

interface PlanResponse {
  plan: {
    psychologistId: number;
    weekday: number;
    time: string;
    format: SessionFormat;
    rescheduledTo: string | null;
  } | null;
}

const toPlan = ({ plan }: PlanResponse): WeeklyPlan | null =>
  plan && {
    therapistId: plan.psychologistId,
    weekday: plan.weekday,
    time: plan.time,
    format: plan.format,
    ...(plan.rescheduledTo && { rescheduledTo: plan.rescheduledTo }),
  };

const EmployeePlanContext = createContext<EmployeePlanValue | null>(null);

export const EmployeePlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const now = useNow();

  const refreshTherapists = useCallback(async () => {
    const { psychologists } = await api<{ psychologists: Therapist[] }>('GET', '/psychologists');
    setTherapists(psychologists);
  }, []);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [planResponse] = await Promise.all([api<PlanResponse>('GET', '/plan'), refreshTherapists()]);
      setPlan(toPlan(planResponse));
      setStatus('ready');
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }, [refreshTherapists]);

  useEffect(() => {
    load();
  }, [load]);

  const choose = useCallback(
    async (psychologistId: number, weekday: number, time: string, format: SessionFormat) => {
      const response = await api<PlanResponse>('PUT', '/plan', { psychologistId, weekday, time, format });
      setPlan(toPlan(response));
      // Free slots changed for the old and the new psychologist
      await refreshTherapists().catch(() => {});
    },
    [refreshTherapists]
  );

  const reschedule = useCallback(async (date: Date) => {
    const response = await api<PlanResponse>('POST', '/plan/reschedule', { startsAt: toLocalIso(date) });
    setPlan(toPlan(response));
  }, []);

  const value = useMemo<EmployeePlanValue>(
    () => ({
      plan,
      therapist: (plan && therapists.find((t) => t.id === plan.therapistId)) || null,
      next: plan ? nextSession(plan, now) : null,
      doneThisWeek: plan ? isSessionDoneThisWeek(plan, now) : false,
      now,
      therapists,
      choose,
      reschedule,
      refreshTherapists,
    }),
    [plan, therapists, now, choose, reschedule, refreshTherapists]
  );

  if (status === 'loading') return <LoadingScreen error={loadError} onRetry={load} />;

  return <EmployeePlanContext.Provider value={value}>{children}</EmployeePlanContext.Provider>;
};

export const useEmployeePlan = () => {
  const ctx = useContext(EmployeePlanContext);
  if (!ctx) throw new Error('useEmployeePlan must be used inside EmployeePlanProvider');
  return ctx;
};
