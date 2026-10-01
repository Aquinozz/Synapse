import React from 'react';
import { Avatar } from '../../components/Avatar';
import { PRICING, formatBRL } from '../../config/pricing';
import { Patient, countSessionsHeld } from '../../data/psychologistMock';
import { Therapist } from '../../types';
import { PatientTab } from './PatientModal';
import { CheckinAlert, Evaluation, formatSessionDay, sessionsToEvaluate } from './evaluations';
import { PatientNotes } from './notes';
import {
  WEEKDAYS,
  formatCountdown,
  occurrenceInWeek,
  startOfMonth,
  useNow,
} from '../../utils/schedule';

interface PsiHomeScreenProps {
  profile: Therapist;
  patients: Patient[];
  openSlotCount: number;
  notes: PatientNotes;
  evaluations: Evaluation[];
  /** Patients whose daily check-in came out very low */
  alerts: CheckinAlert[];
  onDismissAlert: (patientId: number) => void;
  onOpenPatient: (patient: Patient, tab?: PatientTab, day?: string) => void;
  onJoin: (patient: Patient) => void;
  onOpenAgenda: () => void;
}

const SESSION_MS = PRICING.sessionMinutes * 60 * 1000;

export const PsiHomeScreen: React.FC<PsiHomeScreenProps> = ({
  profile,
  patients,
  openSlotCount,
  notes,
  evaluations,
  alerts,
  onDismissAlert,
  onOpenPatient,
  onJoin,
  onOpenAgenda,
}) => {
  const now = useNow();
  const today = now.getDay();

  const todays = patients
    .filter((p) => p.weekday === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  // On a day without sessions, show the next working day instead of an empty list
  const nextDay = [1, 2, 3, 4, 5, 6, 7]
    .map((offset) => (today + offset) % 7)
    .find((weekday) => patients.some((p) => p.weekday === weekday));
  const listDay = todays.length > 0 || nextDay === undefined ? today : nextDay;
  const listed = patients.filter((p) => p.weekday === listDay).sort((a, b) => a.time.localeCompare(b.time));
  const isListToday = listDay === today;

  const toEvaluate = sessionsToEvaluate(patients, evaluations, now);

  const doneThisMonth = countSessionsHeld(patients, startOfMonth(now), now);

  const stats = [
    { label: 'Sessões hoje', value: String(todays.length), hint: now.toLocaleDateString('pt-BR', { weekday: 'long' }), icon: 'today', tone: 'bg-[#e9ddff]/50 text-[#5516be]' },
    { label: 'Pacientes ativos', value: String(patients.length), hint: 'Com horário semanal fixo', icon: 'groups', tone: 'bg-[#dbe1ff]/60 text-[#003ea8]' },
    { label: 'Horários livres', value: String(openSlotCount), hint: 'Abertos para novos pacientes', icon: 'event_available', tone: 'bg-[#6ffbbe]/25 text-[#005236]' },
    { label: 'Repasse estimado', value: formatBRL(doneThisMonth * PRICING.sessionPayout), hint: `${doneThisMonth} ${doneThisMonth === 1 ? 'sessão' : 'sessões'} no mês`, icon: 'payments', tone: 'bg-[#ffe9c7]/70 text-[#7a4100]' },
  ];

  return (
    <div className="screen">
      <section className="flex flex-col">
        <h1 className="font-sora text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight">
          Olá, {profile.name.replace(/^Dra?\.\s*/, '').split(' ')[0]}
        </h1>
        <p className="font-outfit text-sm lg:text-base text-[#494454]">
          {todays.length > 0
            ? `Você tem ${todays.length} ${todays.length === 1 ? 'atendimento' : 'atendimentos'} hoje.`
            : 'Você não tem atendimentos hoje.'}
        </p>
      </section>

      {profile.status === 'pending' && (
        <section className="rounded-3xl p-4 bg-[#fff8e8] border border-[#ffd8a8] flex items-start gap-3">
          <span className="material-symbols-outlined text-[1.375rem] text-[#7a4100] shrink-0">hourglass_top</span>
          <p className="font-outfit text-sm text-[#494454] leading-snug">
            <strong className="text-[#7a4100] font-semibold">Registro em análise.</strong> Estamos conferindo o seu {profile.reg}. Enquanto isso, monte o perfil e abra os horários; os funcionários passam a ver você assim que a conferência terminar.
          </p>
        </section>
      )}

      {alerts.length > 0 && (
        <section role="alert" className="card !border-[#ffb4ab] !bg-[#fff5f3]">
          <h2 className="font-sora text-base lg:text-lg font-bold text-[#93000a] flex items-center gap-2">
            <span className="material-symbols-outlined text-[1.375rem] fill-1">notifications</span>
            {alerts.length === 1 ? 'Um paciente precisa de atenção' : `${alerts.length} pacientes precisam de atenção`}
          </h2>
          <p className="font-outfit text-sm text-[#494454] mb-3">
            O check-in diário destes pacientes ficou muito baixo.
          </p>
          <ul className="flex flex-col gap-2">
            {alerts.map((alert) => {
              const patient = patients.find((p) => p.id === alert.patientId);
              return (
                <li
                  key={alert.patientId}
                  className="p-3 rounded-2xl bg-white border border-[#ffdad6] flex items-center gap-3 flex-wrap"
                >
                  <Avatar name={alert.name} image={alert.avatar} />
                  <div className="flex flex-col min-w-0 flex-1 basis-40">
                    <span className="font-outfit text-sm font-semibold text-[#0b1c30]">{alert.name}</span>
                    <span className="font-outfit text-xs text-[#494454]">
                      Check-in de {formatSessionDay(alert.day)}: índice{' '}
                      <strong className="text-[#ba1a1a]">{alert.score} de 100</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {patient && (
                      <button
                        onClick={() => onOpenPatient(patient)}
                        aria-label={`Ver paciente ${alert.name}`}
                        className="min-h-10 px-4 py-1 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be] font-outfit text-sm font-semibold transition-colors"
                      >
                        Ver paciente
                      </button>
                    )}
                    <button
                      onClick={() => onDismissAlert(alert.patientId)}
                      aria-label={`Marcar o alerta de ${alert.name} como visto`}
                      className="min-h-10 px-4 py-1 rounded-full bg-[#ba1a1a] hover:bg-[#93000a] text-white font-outfit text-sm font-semibold transition-colors"
                    >
                      Marcar como visto
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-label="Resumo" className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 flex flex-col gap-1 ${s.tone}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-outfit text-xs font-semibold opacity-90">{s.label}</span>
              <span className="material-symbols-outlined text-[1.25rem] opacity-80">{s.icon}</span>
            </div>
            <span className="font-sora text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight tabular-nums">
              {s.value}
            </span>
            <span className="font-outfit text-xs text-[#494454] truncate first-letter:uppercase">{s.hint}</span>
          </div>
        ))}
      </section>

      {toEvaluate.length > 0 && (
        <section className="card !border-[#ffd8a8] !bg-[#fffaf0]">
          <h2 className="font-sora text-base lg:text-lg font-bold text-[#0b1c30] flex items-center gap-2">
            <span className="material-symbols-outlined text-[1.375rem] text-[#7a4100]">rate_review</span>
            Sessões para avaliar
          </h2>
          <p className="font-outfit text-sm text-[#494454] mb-3">
            Dê uma nota a cada sessão para acompanhar a evolução do paciente.
          </p>
          <ul className="flex flex-col gap-2">
            {toEvaluate.map(({ patient, day }) => (
              <li
                key={`${patient.id}-${day}`}
                className="p-3 rounded-2xl bg-white border border-[#e5eeff] flex items-center gap-3 flex-wrap"
              >
                <Avatar name={patient.name} image={patient.avatar} />
                <div className="flex flex-col min-w-0 flex-1 basis-32">
                  <span className="font-outfit text-sm font-semibold text-[#0b1c30]">{patient.name}</span>
                  <span className="font-outfit text-xs text-[#494454]">Sessão de {formatSessionDay(day)}</span>
                </div>
                <button
                  onClick={() => onOpenPatient(patient, 'evolution', day)}
                  aria-label={`Avaliar sessão de ${formatSessionDay(day)} com ${patient.name}`}
                  className="min-h-10 px-4 py-1 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold active:scale-95 transition-all shrink-0"
                >
                  Avaliar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-sora text-base lg:text-lg font-bold text-[#0b1c30]">
            {isListToday ? 'Hoje' : `Próximos atendimentos · ${WEEKDAYS[listDay]}`}
          </h2>
          <button
            onClick={onOpenAgenda}
            className="h-10 px-4 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be] font-outfit text-sm font-semibold transition-colors"
          >
            Ver agenda
          </button>
        </div>

        {patients.length === 0 && (
          <p className="p-6 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff] text-center font-outfit text-sm text-[#494454]">
            Você ainda não tem pacientes. Abra horários na agenda para que os funcionários possam escolher você.
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {listed.map((patient) => {
            const start = occurrenceInWeek(patient.weekday, patient.time, now);
            const isOver = isListToday && start.getTime() + SESSION_MS <= now.getTime();
            const isLive = isListToday && !isOver && start.getTime() <= now.getTime();
            const pinned = notes.notesOf(patient.id).find((note) => note.pinned);
            return (
              <li
                key={patient.id}
                className={`p-3 rounded-2xl border flex items-center gap-3 flex-wrap sm:flex-nowrap ${
                  isLive ? 'border-[#6b38d4]/40 bg-[#fbf9ff]' : 'border-[#e5eeff]'
                }`}
              >
                <span className="min-w-12 font-sora text-sm font-bold text-[#0051d5] tabular-nums shrink-0">
                  {patient.time}
                </span>
                <Avatar name={patient.name} image={patient.avatar} />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-outfit text-sm font-semibold text-[#0b1c30]">{patient.name}</span>
                  <span className="font-outfit text-xs text-[#494454]">
                    {patient.format === 'video' ? 'Vídeo' : 'Áudio'} · {PRICING.sessionMinutes} min
                    {isListToday && !isOver && !isLive && ` · ${formatCountdown(start, now)}`}
                  </span>
                  {pinned && (
                    <span className="font-outfit text-xs text-[#7a4100] flex items-start gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[1rem] fill-1 shrink-0">push_pin</span>
                      <span className="line-clamp-2">{pinned.text}</span>
                    </span>
                  )}
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-outfit text-2xs font-semibold shrink-0 ${
                    isOver
                      ? 'bg-[#eff4ff] text-[#494454]'
                      : isLive
                      ? 'bg-[#6b38d4] text-white'
                      : 'bg-[#6ffbbe]/30 text-[#005236]'
                  }`}
                >
                  {isOver ? 'Realizada' : isLive ? 'Agora' : 'Confirmada'}
                </span>
                <button
                  onClick={() => onOpenPatient(patient, 'notes')}
                  aria-label={`Anotações de ${patient.name}`}
                  className="h-10 px-3 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be] font-outfit text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <span className="material-symbols-outlined text-[1.25rem]">sticky_note_2</span>
                  <span>Anotações</span>
                </button>
                {isListToday && !isOver && (
                  <button
                    onClick={() => onJoin(patient)}
                    className={`flex-1 sm:flex-none h-10 px-4 rounded-full font-outfit text-sm font-semibold active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                      isLive
                        ? 'bg-[#6b38d4] hover:bg-[#8455ef] text-white'
                        : 'bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[1.25rem]">video_camera_front</span>
                    <span>Abrir sala</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};
