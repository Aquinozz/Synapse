import React, { useState } from 'react';
import { Avatar } from './Avatar';
import { sound } from '../utils/audio';
import { useToast } from './Toast';
import { getWellnessStatus } from '../utils/wellness';
import { formatCountdown, formatDay, formatDayTime, formatRecurring, formatTime, isSameDay } from '../utils/schedule';
import { useEmployeePlan } from '../areas/employee/plan';
import { useSession } from '../auth/session';

interface HomeScreenProps {
  onStartAssessment: () => void;
  onOpenBreathing: (technique?: '478' | 'box') => void;
  onOpenSOS: () => void;
  onOpenVideoRoom: () => void;
  onOpenTherapistProfile: () => void;
  onOpenChat: () => void;
  onReschedule: () => void;
  onFindTherapist: () => void;
  onToggleDiscretion: () => void;
  currentWellnessScore?: number;
  hasCheckedInToday?: boolean;
}

type MoodId = 'exhausted' | 'tense' | 'serene' | 'focused' | 'energetic';

const MOODS: { id: MoodId; emoji: string; label: string }[] = [
  { id: 'exhausted', emoji: '😴', label: 'Exausta' },
  { id: 'tense', emoji: '⚡', label: 'Tensa' },
  { id: 'serene', emoji: '🌱', label: 'Serena' },
  { id: 'focused', emoji: '✨', label: 'Focada' },
  { id: 'energetic', emoji: '🚀', label: 'Energia' },
];

const WEEK = [
  { day: 'Seg', value: 62 },
  { day: 'Ter', value: 75 },
  { day: 'Qua', value: 68 },
  { day: 'Qui', value: 87 },
  { day: 'Sex', value: 81 },
  { day: 'Hoje', value: 100, active: true },
  { day: 'Dom', value: 30, upcoming: true },
];

// Circumference = 2 * PI * 38
const GAUGE_CIRCUMFERENCE = 238.76;

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartAssessment,
  onOpenBreathing,
  onOpenSOS,
  onOpenVideoRoom,
  onOpenTherapistProfile,
  onOpenChat,
  onReschedule,
  onFindTherapist,
  onToggleDiscretion,
  currentWellnessScore = 84,
  hasCheckedInToday = false,
}) => {
  const showToast = useToast();
  const [selectedMood, setSelectedMood] = useState<MoodId | null>(null);
  const { session: user } = useSession();
  const { plan, therapist, next, doneThisWeek, now } = useEmployeePlan();
  // Everything about the weekly session exists only after the employee picks a psychologist
  const weekly = plan && therapist && next ? { plan, therapist, next } : null;
  const sessionIsToday = weekly !== null && isSameDay(weekly.next, now);
  const firstName = user?.name.split(' ')[0] ?? '';

  const handleMoodSelect = (id: MoodId, label: string) => {
    setSelectedMood(id);
    sound.playChime('click');
    showToast(`Momento "${label}" registrado no seu diário seguro.`);
  };

  const status = getWellnessStatus(currentWellnessScore);
  const strokeDashoffset = GAUGE_CIRCUMFERENCE - (GAUGE_CIRCUMFERENCE * currentWellnessScore) / 100;

  const stats = [
    {
      label: 'Bem-estar',
      value: `${currentWellnessScore}`,
      unit: '/100',
      hint: status.label,
      icon: 'psychology',
      tone: 'bg-[#e9ddff]/50 text-[#5516be]',
    },
    {
      label: 'Próxima sessão',
      value: weekly ? formatTime(weekly.next) : '—',
      unit: weekly ? formatDay(weekly.next, now) : '',
      hint: weekly ? `Com ${weekly.therapist.name}` : 'Escolha seu psicólogo',
      icon: 'event',
      tone: 'bg-[#dbe1ff]/60 text-[#003ea8]',
    },
    {
      label: 'Sessão da semana',
      value: !weekly ? 'Livre' : doneThisWeek ? 'Feita' : 'Marcada',
      unit: '',
      hint: '1 por semana no seu plano',
      icon: 'event_repeat',
      tone: 'bg-[#6ffbbe]/25 text-[#005236]',
    },
    {
      label: 'Dias ativos',
      value: '6',
      unit: 'de 7',
      hint: 'Nesta semana',
      icon: 'local_fire_department',
      tone: 'bg-[#ffe9c7]/70 text-[#7a4100]',
    },
  ];

  return (
    <div className="screen">
      {/* Saudação */}
      <section className="flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <h1 className="font-sora text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight">
            Olá, {firstName}
          </h1>
          <p className="font-outfit text-sm lg:text-base text-[#494454]">
            Como está sua energia mental hoje?
          </p>
        </div>

        <button
          onClick={onToggleDiscretion}
          className="h-11 px-3 sm:px-4 rounded-full bg-white border border-[#e5eeff] flex items-center gap-2 text-[#494454] hover:text-[#6b38d4] hover:border-[#6b38d4]/30 active:scale-95 transition-all shrink-0"
          aria-label="Ocultar a tela (modo discreto)"
        >
          <span className="material-symbols-outlined text-[1.375rem]">visibility_off</span>
          <span className="hidden sm:inline font-outfit text-sm font-medium">Modo discreto</span>
        </button>
      </section>

      {/* Resumo em números */}
      <section aria-label="Resumo" className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 flex flex-col gap-1 min-w-0 ${s.tone}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-outfit text-xs font-semibold opacity-90">{s.label}</span>
              <span className="material-symbols-outlined text-[1.25rem] opacity-80">{s.icon}</span>
            </div>
            <div className="flex items-baseline gap-x-1 flex-wrap">
              <span className="font-sora text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight tabular-nums">
                {s.value}
              </span>
              {s.unit && <span className="font-outfit text-xs text-[#494454]">{s.unit}</span>}
            </div>
            <span className="font-outfit text-xs text-[#494454] truncate">{s.hint}</span>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-start">
        {/* Coluna principal */}
        <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6 min-w-0">
          {/* Agenda de hoje */}
          <section className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-sora text-base lg:text-lg font-bold text-[#0b1c30]">
                {sessionIsToday ? 'Hoje' : 'Sua agenda'}
              </h2>
              <span className="font-outfit text-xs text-[#494454]">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>

            <ul className="flex flex-col gap-2">
              {weekly ? (
                <li className="p-3 rounded-2xl border border-[#e5eeff] flex items-center gap-3 flex-wrap">
                  <span className="min-w-12 font-sora text-sm font-bold text-[#0051d5] tabular-nums shrink-0">
                    {formatTime(weekly.next)}
                  </span>
                  <Avatar name={weekly.therapist.name} image={weekly.therapist.avatar} />
                  <div className="flex flex-col min-w-0 flex-1 basis-40">
                    <span className="font-outfit text-sm font-semibold text-[#0b1c30]">
                      Sessão com {weekly.therapist.name}
                    </span>
                    <span className="font-outfit text-xs text-[#494454] flex items-center gap-1">
                      <span className="material-symbols-outlined text-smd text-[#006947]">lock</span>
                      {sessionIsToday
                        ? `${weekly.plan.format === 'video' ? 'Vídeo' : 'Áudio'} criptografado · ${formatCountdown(weekly.next, now)}`
                        : `${formatDayTime(weekly.next, now)} · ${formatCountdown(weekly.next, now)}`}
                    </span>
                  </div>
                  <span className="hidden sm:inline px-2.5 py-1 rounded-full bg-[#6ffbbe]/30 text-[#005236] font-outfit text-2xs font-semibold shrink-0">
                    Confirmada
                  </span>
                  {sessionIsToday ? (
                    <button
                      onClick={onOpenVideoRoom}
                      className="grow sm:grow-0 h-10 px-4 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[1.25rem]">video_camera_front</span>
                      <span>Entrar</span>
                    </button>
                  ) : (
                    // Only this week's session can be moved
                    !doneThisWeek && (
                      <button
                        onClick={onReschedule}
                        className="grow sm:grow-0 h-10 px-4 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be] font-outfit text-sm font-semibold active:scale-95 transition-all shrink-0"
                      >
                        Remarcar
                      </button>
                    )
                  )}
                </li>
              ) : (
                <li className="p-4 rounded-2xl border border-dashed border-[#6b38d4]/40 bg-[#fbf9ff] flex items-center gap-3 flex-wrap">
                  <span className="w-10 h-10 rounded-full bg-[#e9ddff] text-[#6b38d4] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[1.375rem]">person_search</span>
                  </span>
                  <div className="flex flex-col min-w-0 flex-1 basis-40">
                    <span className="font-outfit text-sm font-semibold text-[#0b1c30]">
                      Escolha seu psicólogo
                    </span>
                    <span className="font-outfit text-xs text-[#494454]">
                      Seu plano cobre 1 sessão por semana. Defina um profissional e um horário fixo.
                    </span>
                  </div>
                  <button
                    onClick={onFindTherapist}
                    className="grow sm:grow-0 h-10 px-4 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold active:scale-95 transition-all shrink-0"
                  >
                    Ver psicólogos
                  </button>
                </li>
              )}

              <li className="p-3 rounded-2xl border border-[#e5eeff] flex items-center gap-3 flex-wrap">
                <span className="min-w-12 font-outfit text-xs font-semibold text-[#7b7486] shrink-0">2 min</span>
                <span className="w-10 h-10 rounded-full bg-[#dbe1ff]/70 text-[#0051d5] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[1.375rem]">fact_check</span>
                </span>
                <div className="flex flex-col min-w-0 flex-1 basis-40">
                  <span className="font-outfit text-sm font-semibold text-[#0b1c30]">
                    Check-in diário
                  </span>
                  <span className="font-outfit text-xs text-[#494454]">
                    {hasCheckedInToday ? 'Feito hoje. Você pode refazer se algo mudou.' : '5 perguntas rápidas sobre o seu dia'}
                  </span>
                </div>
                {hasCheckedInToday ? (
                  <>
                    <span className="px-2.5 py-1 rounded-full bg-[#6ffbbe]/30 text-[#005236] font-outfit text-2xs font-semibold shrink-0 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[1rem]">check</span>
                      Concluído
                    </span>
                    <button
                      onClick={onStartAssessment}
                      className="grow sm:grow-0 h-10 px-4 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be] font-outfit text-sm font-semibold active:scale-95 transition-all shrink-0"
                    >
                      Refazer
                    </button>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline px-2.5 py-1 rounded-full bg-[#ffe9c7] text-[#7a4100] font-outfit text-2xs font-semibold shrink-0">
                      Pendente
                    </span>
                    <button
                      onClick={onStartAssessment}
                      className="grow sm:grow-0 h-10 px-4 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be] font-outfit text-sm font-semibold active:scale-95 transition-all shrink-0"
                    >
                      Fazer agora
                    </button>
                  </>
                )}
              </li>

              <li className="p-3 rounded-2xl border border-[#e5eeff] flex items-center gap-3 flex-wrap">
                <span className="min-w-12 font-outfit text-xs font-semibold text-[#7b7486] shrink-0">3 min</span>
                <span className="w-10 h-10 rounded-full bg-[#e9ddff]/70 text-[#6b38d4] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[1.375rem]">air</span>
                </span>
                <div className="flex flex-col min-w-0 flex-1 basis-40">
                  <span className="font-outfit text-sm font-semibold text-[#0b1c30]">
                    Respiração 4-7-8
                  </span>
                  <span className="font-outfit text-xs text-[#494454] flex items-center gap-1">
                    <span className="material-symbols-outlined text-smd text-[#6b38d4]">neurology</span>
                    {sessionIsToday ? 'Sugestão da Synapse AI antes da sessão' : 'Sugestão da Synapse AI para hoje'}
                  </span>
                </div>
                <button
                  onClick={() => onOpenBreathing('478')}
                  className="grow sm:grow-0 h-10 px-4 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be] font-outfit text-sm font-semibold active:scale-95 transition-all shrink-0"
                >
                  Iniciar
                </button>
              </li>
            </ul>
          </section>

          {/* Índice de Bem-Estar */}
          <section className="card">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-sora text-base lg:text-lg font-bold text-[#0b1c30]">
                Índice de Bem-Estar
              </h2>
              <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border ${status.chip}`}>
                <span className="material-symbols-outlined text-[1rem] fill-1">{status.icon}</span>
                <span className="font-outfit text-xs font-semibold">{status.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 lg:gap-6 pt-4">
              <div
                className="relative w-24 h-24 lg:w-28 lg:h-28 flex items-center justify-center shrink-0"
                role="img"
                aria-label={`Índice de bem-estar: ${currentWellnessScore} de 100`}
              >
                <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                  <circle className="text-[#e5eeff]" cx="48" cy="48" fill="transparent" r="38" stroke="currentColor" strokeWidth="8" />
                  <circle
                    className={status.stroke}
                    cx="48"
                    cy="48"
                    fill="transparent"
                    r="38"
                    stroke="currentColor"
                    strokeDasharray={GAUGE_CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    strokeWidth="8"
                    style={{ transition: 'stroke-dashoffset 1.4s ease-out' }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="font-sora text-[2rem] font-bold text-[#0b1c30] leading-none tabular-nums">
                    {currentWellnessScore}
                  </span>
                  <span className="font-outfit text-2xs text-[#494454] font-medium">/ 100</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 min-w-0">
                {hasCheckedInToday ? (
                  <>
                    <div className={`flex items-center gap-1 font-outfit text-sm font-bold ${status.text}`}>
                      <span className="material-symbols-outlined text-[1.25rem]">update</span>
                      <span>Atualizado com o check-in de hoje</span>
                    </div>
                    <p className="font-outfit text-sm text-[#494454] leading-snug">{status.message}</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-[#006947] font-outfit text-sm font-bold">
                      <span className="material-symbols-outlined text-[1.25rem]">trending_up</span>
                      <span>+12% nesta semana</span>
                    </div>
                    <p className="font-outfit text-sm text-[#494454] leading-snug">
                      Sua clareza mental e autorregulação evoluíram com a frequência nas pausas de respiração.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Registro rápido de humor */}
            <div className="pt-5">
              <p id="mood-label" className="font-outfit text-sm text-[#494454] mb-2 font-medium">
                Como você está agora?
              </p>
              <div
                role="radiogroup"
                aria-labelledby="mood-label"
                className="flex items-center justify-between gap-1 bg-[#eff4ff] p-1.5 rounded-2xl"
              >
                {MOODS.map((m) => {
                  const isSelected = selectedMood === m.id;
                  return (
                    <button
                      key={m.id}
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleMoodSelect(m.id, m.label)}
                      className={`flex-1 py-2 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 ${
                        isSelected ? 'bg-white shadow-sm' : 'hover:bg-white/60'
                      }`}
                    >
                      <span className="text-xl" aria-hidden="true">{m.emoji}</span>
                      <span
                        className={`font-outfit text-2xs mt-0.5 ${
                          isSelected ? 'text-[#6b38d4] font-bold' : 'text-[#494454]'
                        }`}
                      >
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Evolução semanal */}
          <section className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-sora text-base lg:text-lg font-bold text-[#0b1c30]">
                Evolução semanal
              </h2>
              <span className="font-outfit text-xs text-[#006947] font-semibold">6 de 7 dias ativos</span>
            </div>

            <div className="flex items-end justify-between h-28 gap-2 sm:gap-4 pt-4" aria-hidden="true">
              {WEEK.map((col) => (
                <div key={col.day} className="flex flex-col items-center justify-end gap-1.5 flex-1 h-full">
                  <div
                    className={`w-full max-w-12 rounded-lg ${
                      col.active
                        ? 'bg-[#6b38d4]'
                        : col.upcoming
                        ? 'bg-[#eff4ff] border border-dashed border-[#cbc3d7]'
                        : 'bg-[#dce9ff]'
                    }`}
                    style={{ height: `${col.value * 0.8}%` }}
                  />
                  <span
                    className={`font-outfit text-2xs ${
                      col.active ? 'font-bold text-[#6b38d4]' : col.upcoming ? 'text-[#7b7486]' : 'text-[#494454]'
                    }`}
                  >
                    {col.day}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Coluna lateral */}
        <div className="flex flex-col gap-4 lg:gap-6 min-w-0">
          {/* Ação principal */}
          <section className="rounded-3xl p-5 bg-gradient-to-br from-[#6b38d4] to-[#0051d5] text-white relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <h2 className="font-sora text-lg font-bold tracking-tight relative">
              {hasCheckedInToday ? 'Check-in de hoje concluído' : 'Seu check-in de hoje'}
            </h2>
            <p className="font-outfit text-sm text-white/85 mt-1 leading-snug relative">
              {hasCheckedInToday
                ? 'Obrigado por cuidar de você. Seu índice já foi atualizado.'
                : 'Dois minutos para entender como você está. Sua empresa não vê o seu resultado.'}
            </p>
            <button
              onClick={hasCheckedInToday ? () => onOpenBreathing('478') : onStartAssessment}
              className="relative mt-4 w-full min-h-12 px-3 py-2 rounded-full bg-white text-[#5516be] font-outfit text-sm font-bold leading-tight hover:bg-[#f8f9ff] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[1.375rem]">
                {hasCheckedInToday ? 'air' : 'fact_check'}
              </span>
              <span>{hasCheckedInToday ? 'Fazer uma pausa guiada' : 'Começar check-in'}</span>
            </button>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onOpenBreathing('478')}
              className="min-h-12 px-2 py-1.5 rounded-2xl bg-white border border-[#e5eeff] hover:border-[#6b38d4]/30 flex items-center justify-center gap-2 text-[#0b1c30] font-outfit text-sm font-semibold leading-tight active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[1.375rem] text-[#006947]">air</span>
              <span>Pausa guiada</span>
            </button>

            <button
              onClick={onOpenSOS}
              className="min-h-12 px-2 py-1.5 rounded-2xl bg-[#ffdad6]/60 hover:bg-[#ffdad6] flex items-center justify-center gap-2 text-[#ba1a1a] font-outfit text-sm font-semibold leading-tight active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[1.375rem] fill-1">shield_with_heart</span>
              <span>SOS</span>
            </button>
          </div>

          {/* Psicólogo fixo */}
          {weekly ? (
            <section className="card flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="font-sora text-base font-bold text-[#0b1c30]">
                  {weekly.therapist.name.startsWith('Dra.') ? 'Sua psicóloga' : 'Seu psicólogo'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#dbe1ff]/60 text-[#003ea8] font-outfit text-2xs font-semibold">
                  <span className="material-symbols-outlined text-smd">verified</span>
                  Pago pela empresa
                </span>
              </div>

              <button
                onClick={onOpenTherapistProfile}
                className="flex items-center gap-3 text-left rounded-2xl -m-2 p-2 hover:bg-[#f8f9ff] transition-colors"
              >
                <Avatar name={weekly.therapist.name} image={weekly.therapist.avatar} className="w-14 h-14 text-lg" />
                <span className="flex flex-col min-w-0 flex-1">
                  <span className="font-sora text-sm font-bold text-[#0b1c30]">{weekly.therapist.name}</span>
                  <span className="font-outfit text-xs text-[#494454] truncate">{weekly.therapist.reg}</span>
                  <span className="flex items-center gap-1 mt-0.5 font-outfit text-xs text-[#494454]">
                    <span className="material-symbols-outlined text-[1rem] fill-1 text-amber-500">star</span>
                    <strong className="text-[#0b1c30]">{weekly.therapist.rating.toFixed(1)}</strong> · {weekly.therapist.reviewCount} avaliações
                  </span>
                </span>
                <span className="material-symbols-outlined text-[1.375rem] text-[#7b7486]">chevron_right</span>
              </button>

              <div className="p-3 rounded-2xl bg-[#eff4ff] flex items-center gap-2 font-outfit text-sm text-[#0b1c30]">
                <span className="material-symbols-outlined text-[1.25rem] text-[#6b38d4]">event_repeat</span>
                <span>
                  Horário fixo: <strong>{formatRecurring(weekly.plan.weekday, weekly.plan.time).toLowerCase()}</strong>
                </span>
              </div>

              <button
                onClick={onOpenChat}
                className="min-h-11 px-4 py-1.5 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[1.25rem]">chat</span>
                Enviar mensagem
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onReschedule}
                  disabled={doneThisWeek}
                  className="h-11 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be] font-outfit text-sm font-semibold transition-colors disabled:text-[#7b7486] disabled:hover:bg-[#eff4ff]"
                >
                  {doneThisWeek ? 'Semana realizada' : 'Remarcar a semana'}
                </button>
                <button
                  onClick={onFindTherapist}
                  className="h-11 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be] font-outfit text-sm font-semibold transition-colors"
                >
                  Trocar de psicólogo
                </button>
              </div>
            </section>
          ) : (
            <section className="card flex flex-col gap-3">
              <h2 className="font-sora text-base font-bold text-[#0b1c30]">Seu psicólogo</h2>
              <p className="font-outfit text-sm text-[#494454] leading-snug">
                Você ainda não escolheu um profissional. A sessão semanal é paga pela sua empresa, em sigilo.
              </p>
              <button
                onClick={onFindTherapist}
                className="h-11 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[1.25rem]">person_search</span>
                Escolher psicólogo
              </button>
            </section>
          )}

          {/* Privacidade */}
          <section className="rounded-3xl p-4 bg-[#eff4ff] border border-[#dce9ff] flex items-start gap-3 lg:hidden">
            <span className="material-symbols-outlined text-[1.375rem] text-[#0051d5] fill-1 shrink-0">verified_user</span>
            <p className="font-outfit text-sm text-[#494454] leading-snug">
              <strong className="text-[#003ea8] font-semibold">100% anônimo para a empresa.</strong> Ninguém do RH ou da liderança vê seus dados individuais.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
