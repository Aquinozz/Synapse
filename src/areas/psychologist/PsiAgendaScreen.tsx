import React, { useState } from 'react';
import { AGENDA_TIMES, AGENDA_WEEKDAYS, Patient, slotKey } from '../../data/psychologistMock';
import { sound } from '../../utils/audio';
import { WEEKDAYS, WEEKDAYS_SHORT } from '../../utils/schedule';

interface PsiAgendaScreenProps {
  patients: Patient[];
  openSlots: Set<string>;
  onToggleSlot: (weekday: number, time: string) => void;
  onOpenPatient: (patient: Patient) => void;
}

export const PsiAgendaScreen: React.FC<PsiAgendaScreenProps> = ({
  patients,
  openSlots,
  onToggleSlot,
  onOpenPatient,
}) => {
  const today = new Date().getDay();
  // Phones show one day at a time
  const [selectedDay, setSelectedDay] = useState(AGENDA_WEEKDAYS.includes(today) ? today : AGENDA_WEEKDAYS[0]);

  const times = [
    ...new Set([
      ...AGENDA_TIMES,
      ...patients.map((p) => p.time),
      ...[...openSlots].map((key) => key.split('-')[1]),
    ]),
  ].sort();

  const patientAt = (weekday: number, time: string) =>
    patients.find((p) => p.weekday === weekday && p.time === time);

  return (
    <div className="screen">
      <section className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col">
          <h1 className="font-sora text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight">Agenda semanal</h1>
          <p className="font-outfit text-sm lg:text-base text-[#494454]">
            Toque em um paciente para ver as anotações. Horários vazios abrem ou fecham vagas para novos pacientes.
          </p>
        </div>
        <div className="flex items-center gap-4 font-outfit text-xs text-[#494454]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#e9ddff] border border-[#6b38d4]/30" /> Paciente
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#6ffbbe]/40 border border-[#00855b]/30" /> Livre
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border border-dashed border-[#cbc3d7]" /> Fechado
          </span>
        </div>
      </section>

      {/* Day picker (phones) */}
      <div role="tablist" aria-label="Dia da semana" className="md:hidden grid grid-cols-5 gap-1.5 p-1.5 rounded-2xl bg-[#eff4ff]">
        {AGENDA_WEEKDAYS.map((weekday) => (
          <button
            key={weekday}
            role="tab"
            aria-selected={selectedDay === weekday}
            onClick={() => setSelectedDay(weekday)}
            className={`h-10 rounded-xl font-outfit text-sm font-semibold transition-all ${
              selectedDay === weekday ? 'bg-white text-[#5516be] shadow-sm' : 'text-[#494454]'
            }`}
          >
            {WEEKDAYS_SHORT[weekday]}
          </button>
        ))}
      </div>

      <section className="card !p-3 lg:!p-4 grid md:grid-cols-5 gap-3">
        {AGENDA_WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className={`flex-col gap-1.5 min-w-0 ${selectedDay === weekday ? 'flex' : 'hidden md:flex'}`}
          >
            <h2
              className={`font-sora text-sm font-bold text-center py-1.5 rounded-xl ${
                weekday === today ? 'bg-[#6b38d4] text-white' : 'text-[#0b1c30]'
              }`}
            >
              {WEEKDAYS[weekday]}
            </h2>

            {times.map((time) => {
              const patient = patientAt(weekday, time);
              const isOpen = openSlots.has(slotKey(weekday, time));

              if (patient) {
                return (
                  <button
                    key={time}
                    onClick={() => onOpenPatient(patient)}
                    aria-label={`${WEEKDAYS[weekday]} ${time}: ${patient.name}, abrir anotações`}
                    className="min-h-12 px-3 py-1.5 rounded-xl bg-[#e9ddff]/70 hover:bg-[#e9ddff] border border-[#6b38d4]/20 flex items-center gap-2 font-outfit text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-[#5516be] tabular-nums shrink-0">{time}</span>
                    <span className="text-sm font-semibold text-[#0b1c30] truncate">{patient.name}</span>
                  </button>
                );
              }

              return (
                <button
                  key={time}
                  aria-pressed={isOpen}
                  aria-label={`${WEEKDAYS[weekday]} ${time}: ${isOpen ? 'livre, toque para fechar' : 'fechado, toque para abrir'}`}
                  onClick={() => {
                    sound.playChime('click');
                    onToggleSlot(weekday, time);
                  }}
                  className={`min-h-12 px-3 py-1.5 rounded-xl flex items-center gap-2 font-outfit text-left transition-colors border ${
                    isOpen
                      ? 'bg-[#6ffbbe]/25 border-[#00855b]/25 hover:bg-[#6ffbbe]/40'
                      : 'border-dashed border-[#cbc3d7] hover:border-[#6b38d4]/50 hover:bg-[#f8f9ff]'
                  }`}
                >
                  <span className={`text-xs font-bold tabular-nums shrink-0 ${isOpen ? 'text-[#005236]' : 'text-[#7b7486]'}`}>
                    {time}
                  </span>
                  <span className={`text-sm truncate ${isOpen ? 'font-semibold text-[#005236]' : 'text-[#7b7486]'}`}>
                    {isOpen ? 'Livre' : 'Fechado'}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </section>
    </div>
  );
};
