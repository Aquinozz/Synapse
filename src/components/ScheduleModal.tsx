import React, { useState } from 'react';
import { SessionFormat, Therapist } from '../types';
import { ApiError, errorMessage } from '../api/client';
import { sound } from '../utils/audio';
import {
  WEEKDAYS,
  endOfWeek,
  formatDayTime,
  formatRecurring,
  formatTime,
  nextOccurrence,
  upcomingSlots,
} from '../utils/schedule';
import { useEmployeePlan } from '../areas/employee/plan';
import { Modal, ModalCloseButton } from './Modal';

/** `choose` sets the fixed weekly slot; `reschedule` moves only this week's session */
export type ScheduleMode = 'choose' | 'reschedule';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapist: Therapist | null;
  mode: ScheduleMode;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, therapist, mode }) => (
  <Modal
    isOpen={isOpen && therapist !== null}
    onClose={onClose}
    label={
      mode === 'reschedule'
        ? 'Remarcar a sessão desta semana'
        : `Escolher horário semanal com ${therapist?.name ?? ''}`
    }
    maxWidth="max-w-lg"
    className="gap-4"
  >
    {therapist && <ScheduleContent therapist={therapist} mode={mode} onClose={onClose} />}
  </Modal>
);

const FORMATS: { id: SessionFormat; label: string; icon: string }[] = [
  { id: 'video', label: 'Vídeo', icon: 'videocam' },
  { id: 'audio', label: 'Apenas áudio', icon: 'call' },
];

const ScheduleContent: React.FC<{ therapist: Therapist; mode: ScheduleMode; onClose: () => void }> = ({
  therapist,
  mode,
  onClose,
}) => {
  const {
    plan,
    therapist: currentTherapist,
    therapists,
    next,
    now,
    choose,
    reschedule,
    refreshTherapists,
  } = useEmployeePlan();
  // Free slots can change while the modal is open, so read the therapist from the live directory
  const live = therapists.find((t) => t.id === therapist.id) ?? therapist;
  const isCurrent = currentTherapist?.id === therapist.id;
  const isSwitching = mode === 'choose' && currentTherapist !== null && !isCurrent;

  // choose: recurring weekday + time. reschedule: one concrete date still left in this week.
  const [weeklySlot, setWeeklySlot] = useState<{ weekday: number; time: string } | null>(
    mode === 'choose' && isCurrent && plan ? { weekday: plan.weekday, time: plan.time } : null
  );
  const weekSlots = upcomingSlots(live, now, endOfWeek(now)).filter(
    (slot) => slot.getTime() !== next?.getTime()
  );
  const [movedTo, setMovedTo] = useState<Date | null>(null);
  const [format, setFormat] = useState<SessionFormat>(plan?.format ?? 'video');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = mode === 'choose' ? weeklySlot !== null : movedTo !== null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    sound.playChime('click');
    try {
      if (mode === 'choose' && weeklySlot) {
        await choose(therapist.id, weeklySlot.weekday, weeklySlot.time, format);
      } else if (movedTo) {
        await reschedule(movedTo);
      }
      setIsDone(true);
      sound.playChime('success');
    } catch (err) {
      setError(errorMessage(err));
      // Someone took the slot first: show what is still free
      if (err instanceof ApiError && err.code === 'slot_taken') {
        setWeeklySlot(null);
        setMovedTo(null);
        await refreshTherapists().catch(() => {});
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="flex flex-col items-center text-center py-4 gap-3">
        <div className="w-16 h-16 rounded-full bg-[#f5fff6] text-[#00855b] flex items-center justify-center shadow-inner">
          <span className="material-symbols-outlined text-[36px] fill-1">check_circle</span>
        </div>
        <div>
          <span className="font-outfit text-xs font-bold uppercase tracking-wider text-[#00855b]">
            {mode === 'choose' ? 'Horário fixo confirmado' : 'Sessão remarcada'}
          </span>
          <h3 className="font-sora text-xl font-bold text-[#0b1c30] mt-1">
            {mode === 'choose' && weeklySlot
              ? formatRecurring(weeklySlot.weekday, weeklySlot.time)
              : movedTo && formatDayTime(movedTo, now)}
          </h3>
          <p className="font-outfit text-sm text-[#494454] mt-1">
            {mode === 'choose' && weeklySlot ? (
              <>
                Com {therapist.name}. Primeira sessão:{' '}
                <strong>{formatDayTime(nextOccurrence(weeklySlot.weekday, weeklySlot.time, now), now)}</strong>.
              </>
            ) : (
              <>
                Só esta semana muda. Seu horário fixo continua{' '}
                <strong>{plan && formatRecurring(plan.weekday, plan.time).toLowerCase()}</strong>.
              </>
            )}
          </p>
        </div>

        <div className="w-full p-3 rounded-2xl bg-[#eff4ff] text-left text-sm text-[#494454] flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#0051d5] shrink-0">verified</span>
          <span>
            Sessão paga pela sua empresa. Ela não é informada de quando ou com quem você consulta.
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full h-12 min-h-12 rounded-full bg-[#6b38d4] text-white font-outfit text-sm font-bold hover:bg-[#8455ef] transition-colors"
        >
          Concluir
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-1">
        <div className="flex flex-col min-w-0">
          <span className="font-outfit text-xs text-[#6b38d4] font-bold uppercase tracking-wider">
            {mode === 'reschedule'
              ? 'Remarcar esta semana'
              : isCurrent
              ? 'Mudar horário fixo'
              : 'Escolher psicólogo'}
          </span>
          <h4 className="font-sora text-lg font-bold text-[#0b1c30]">{therapist.name}</h4>
          <span className="text-xs text-[#494454] font-outfit">
            {therapist.reg} · {therapist.title}
          </span>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>

      {mode === 'choose' ? (
        <div className="flex flex-col gap-2">
          <span id="schedule-slot-label" className="font-outfit text-sm text-[#0b1c30] font-semibold">
            Escolha seu horário de toda semana
          </span>
          <div role="radiogroup" aria-labelledby="schedule-slot-label" className="flex flex-col gap-2">
            {live.weeklyAvailability.length === 0 && (
              <p className="p-3 rounded-2xl bg-[#eff4ff] font-outfit text-sm text-[#494454]">
                {therapist.name} está sem horários livres no momento.
              </p>
            )}
            {live.weeklyAvailability.map(({ weekday, times }) => (
              <div key={weekday} className="flex items-center gap-3">
                <span className="w-16 shrink-0 font-outfit text-sm text-[#494454]">{WEEKDAYS[weekday]}</span>
                <div className="flex flex-wrap gap-2">
                  {times.map((time) => {
                    const isSelected = weeklySlot?.weekday === weekday && weeklySlot.time === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`${WEEKDAYS[weekday]} às ${time}`}
                        onClick={() => setWeeklySlot({ weekday, time })}
                        className={`h-10 px-4 rounded-full font-outfit text-sm font-semibold tabular-nums transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-[#6b38d4] text-white'
                            : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#e5eeff]'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <span id="schedule-slot-label" className="font-outfit text-sm text-[#0b1c30] font-semibold">
            Horários livres até domingo
          </span>
          {next && (
            <p className="font-outfit text-sm text-[#494454]">
              Sua sessão está marcada para <strong>{formatDayTime(next, now)}</strong>.
            </p>
          )}
          {weekSlots.length > 0 ? (
            <div role="radiogroup" aria-labelledby="schedule-slot-label" className="flex flex-wrap gap-2">
              {weekSlots.map((slot) => {
                const isSelected = movedTo?.getTime() === slot.getTime();
                return (
                  <button
                    key={slot.toISOString()}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setMovedTo(slot)}
                    className={`h-10 px-4 rounded-full font-outfit text-sm font-semibold transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-[#6b38d4] text-white'
                        : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#e5eeff]'
                    }`}
                  >
                    {formatDayTime(slot, now)}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-[#eff4ff] font-outfit text-sm text-[#494454]">
              {therapist.name} não tem outro horário livre nesta semana. Você pode manter a sessão
              {next ? ` das ${formatTime(next)}` : ''} ou mudar o seu horário fixo.
            </div>
          )}
        </div>
      )}

      {mode === 'choose' && (
        <div className="flex flex-col gap-2">
          <span id="schedule-format-label" className="font-outfit text-sm text-[#0b1c30] font-semibold">
            Formato
          </span>
          <div role="radiogroup" aria-labelledby="schedule-format-label" className="grid grid-cols-2 gap-2">
            {FORMATS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={format === option.id}
                onClick={() => setFormat(option.id)}
                className={`h-11 rounded-2xl font-outfit text-sm font-semibold flex items-center justify-center gap-2 transition-all border ${
                  format === option.id
                    ? 'bg-[#e9ddff] text-[#23005c] border-[#6b38d4]/30'
                    : 'bg-[#eff4ff] text-[#0b1c30] border-transparent hover:bg-[#e5eeff]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* What the plan covers */}
      <div className="p-3 bg-[#6ffbbe]/25 rounded-2xl flex items-start gap-2 text-[#002113] font-outfit text-sm">
        <span className="material-symbols-outlined text-[18px] text-[#006947] shrink-0">check_circle</span>
        <span>
          {isSwitching
            ? `Seu plano cobre 1 sessão por semana. Ao confirmar, ${therapist.name} passa a ser seu psicólogo no lugar de ${currentTherapist?.name}.`
            : 'Seu plano cobre 1 sessão por semana, paga pela sua empresa.'}
        </span>
      </div>

      {error && (
        <p role="alert" className="p-3 rounded-2xl bg-[#ffdad6]/60 font-outfit text-sm text-[#93000a] flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={isSubmitting || !canConfirm}
        onClick={handleConfirm}
        className="h-12 min-h-12 w-full rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-[#cbc3d7] disabled:active:scale-100"
      >
        {isSubmitting ? (
          <>
            <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
            <span>Confirmando...</span>
          </>
        ) : !canConfirm ? (
          <span>Escolha um horário</span>
        ) : (
          <>
            <span>{mode === 'choose' ? 'Confirmar horário fixo' : 'Confirmar novo horário'}</span>
            <span className="material-symbols-outlined text-[20px]">check</span>
          </>
        )}
      </button>
    </>
  );
};
