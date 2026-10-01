import React, { useEffect, useRef, useState } from 'react';
import { AmbientSound, sound } from '../utils/audio';

interface WellnessHubScreenProps {
  onOpenBreathing: (technique?: '478' | 'box') => void;
  onOpenSOS: () => void;
  onOpenSchedule: () => void;
  /** Ids of the practices finished in this session */
  completedPractices: string[];
  onPracticeDone: (id: string) => void;
}

interface Practice {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  icon: string;
  /** Breathing practices open the guided pacer */
  breathing?: '478' | 'box';
  /** Other practices run as a short on-card timer with one instruction per step */
  steps?: { seconds: number; instruction: string }[];
}

const PRACTICES: Practice[] = [
  {
    id: 'pacer-478',
    title: 'Respiração 4-7-8',
    subtitle: 'Desacelera o corpo e reduz a frequência cardíaca.',
    duration: '3 min',
    icon: 'air',
    breathing: '478',
  },
  {
    id: 'pacer-box',
    title: 'Respiração quadrada',
    subtitle: 'Para clareza mental rápida antes de reuniões e apresentações.',
    duration: '4 min',
    icon: 'crop_square',
    breathing: 'box',
  },
  {
    id: 'eye-2020',
    title: 'Descanso visual 20-20-20',
    subtitle: 'A cada 20 min de tela, olhe para longe (6 m) por 20 segundos.',
    duration: '20 s',
    icon: 'visibility',
    steps: [{ seconds: 20, instruction: 'Olhe para um ponto distante e pisque devagar.' }],
  },
  {
    id: 'neck-stretch',
    title: 'Alongamento de pescoço',
    subtitle: 'Libera a tensão acumulada nos ombros e na cervical.',
    duration: '30 s',
    icon: 'self_improvement',
    steps: [
      { seconds: 15, instruction: 'Incline a cabeça para a direita e respire fundo.' },
      { seconds: 15, instruction: 'Agora incline para a esquerda, soltando os ombros.' },
    ],
  },
];

const SOUNDSCAPES: { id: AmbientSound; name: string; icon: string; detail: string }[] = [
  { id: 'binaural', name: 'Ondas alfa', icon: 'headphones', detail: 'Foco profundo · use fones' },
  { id: 'rain', name: 'Chuva', icon: 'water_drop', detail: 'Ruído rosa para concentrar' },
  { id: 'forest', name: 'Brisa', icon: 'forest', detail: 'Vento suave para relaxar' },
];

export const WellnessHubScreen: React.FC<WellnessHubScreenProps> = ({
  onOpenBreathing,
  onOpenSOS,
  onOpenSchedule,
  completedPractices,
  onPracticeDone,
}) => {
  const [activeSoundscape, setActiveSoundscape] = useState<AmbientSound | null>(null);
  const [running, setRunning] = useState<{ id: string; stepIndex: number; secondsLeft: number } | null>(null);
  const onPracticeDoneRef = useRef(onPracticeDone);
  onPracticeDoneRef.current = onPracticeDone;

  // Ambient audio must not keep playing after leaving the screen
  useEffect(() => () => sound.stopAmbient(), []);

  useEffect(() => {
    if (!running) return;
    const practice = PRACTICES.find((p) => p.id === running.id);
    const steps = practice?.steps ?? [];

    const tick = setTimeout(() => {
      if (running.secondsLeft > 1) {
        setRunning({ ...running, secondsLeft: running.secondsLeft - 1 });
      } else if (running.stepIndex < steps.length - 1) {
        sound.playChime('hold');
        setRunning({
          id: running.id,
          stepIndex: running.stepIndex + 1,
          secondsLeft: steps[running.stepIndex + 1].seconds,
        });
      } else {
        sound.playChime('success');
        onPracticeDoneRef.current(running.id);
        setRunning(null);
      }
    }, 1000);

    return () => clearTimeout(tick);
  }, [running]);

  const toggleSoundscape = (id: AmbientSound) => {
    if (activeSoundscape === id) {
      sound.stopAmbient();
      setActiveSoundscape(null);
    } else {
      sound.startAmbient(id);
      setActiveSoundscape(id);
    }
  };

  const handlePractice = (practice: Practice) => {
    if (practice.breathing) {
      onOpenBreathing(practice.breathing);
      return;
    }
    if (running?.id === practice.id) {
      setRunning(null);
      return;
    }
    if (practice.steps) {
      sound.playChime('breatheIn');
      setRunning({ id: practice.id, stepIndex: 0, secondsLeft: practice.steps[0].seconds });
    }
  };

  const doneCount = PRACTICES.filter((p) => completedPractices.includes(p.id)).length;

  return (
    <div className="screen">
      {/* Banner */}
      <section className="bg-gradient-to-br from-[#6b38d4] to-[#0051d5] rounded-3xl p-5 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute -right-12 -bottom-16 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative max-w-2xl">
          <span className="font-outfit text-xs font-semibold uppercase tracking-wider text-[#dbe1ff]">
            Práticas de bem-estar
          </span>
          <h1 className="font-sora text-2xl lg:text-3xl font-bold tracking-tight mt-1">
            Uma pausa curta muda o seu dia
          </h1>
          <p className="font-outfit text-sm lg:text-base text-white/85 mt-1 leading-snug">
            Exercícios de poucos minutos, baseados em neurociência, para aliviar a tensão e recuperar o foco.
          </p>

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <button
              onClick={() => onOpenBreathing('478')}
              className="h-11 px-5 rounded-full bg-white text-[#5516be] font-outfit text-sm font-bold hover:bg-[#f8f9ff] active:scale-95 transition-all"
            >
              Iniciar respiração guiada
            </button>
            <button
              onClick={onOpenSchedule}
              className="h-11 px-5 rounded-full bg-white/15 text-white font-outfit text-sm font-semibold hover:bg-white/25 active:scale-95 transition-all"
            >
              Falar com um terapeuta
            </button>
          </div>
        </div>
      </section>

      {/* Pausas */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-sora text-base lg:text-lg font-bold text-[#0b1c30]">Pausas de hoje</h2>
          <span className="font-outfit text-sm text-[#006947] font-semibold">
            {doneCount} de {PRACTICES.length} concluídas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
          {PRACTICES.map((practice) => {
            const isDone = completedPractices.includes(practice.id);
            const isRunning = running?.id === practice.id;
            const step = isRunning ? practice.steps?.[running.stepIndex] : undefined;
            return (
              <button
                key={practice.id}
                onClick={() => handlePractice(practice)}
                className={`card !p-4 text-left flex flex-col gap-3 active:scale-[0.99] transition-all group hover:shadow-md ${
                  isRunning ? '!border-[#6b38d4]/50 !bg-[#e9ddff]/30' : 'hover:!border-[#6b38d4]/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <span className="w-10 h-10 rounded-full bg-[#eff4ff] group-hover:bg-[#e9ddff] text-[#6b38d4] flex items-center justify-center shrink-0 transition-colors">
                    <span className="material-symbols-outlined text-[1.375rem]">{practice.icon}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    {isDone && (
                      <span className="flex items-center gap-0.5 font-outfit text-2xs font-semibold text-[#006947]">
                        <span className="material-symbols-outlined text-[1.125rem] fill-1">check_circle</span>
                        Feito
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#494454] font-outfit text-2xs font-semibold">
                      {practice.duration}
                    </span>
                  </span>
                </div>

                <span className="flex flex-col flex-1">
                  <span className="font-sora text-sm font-bold text-[#0b1c30]">{practice.title}</span>
                  <span className="font-outfit text-sm text-[#494454] mt-0.5 leading-snug" aria-live="polite">
                    {step ? step.instruction : practice.subtitle}
                  </span>
                </span>

                <span className="flex items-center justify-between w-full text-sm text-[#6b38d4] font-semibold font-outfit">
                  {isRunning ? (
                    <>
                      <span className="tabular-nums">{running.secondsLeft}s restantes</span>
                      <span className="text-[#494454] font-medium">Parar</span>
                    </>
                  ) : (
                    <>
                      <span>{isDone ? 'Praticar de novo' : 'Praticar agora'}</span>
                      <span className="material-symbols-outlined text-[1.25rem] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sons ambientes */}
      <section className="card">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[1.375rem] text-[#6b38d4]">graphic_eq</span>
            <h2 className="font-sora text-base lg:text-lg font-bold text-[#0b1c30]">Sons para focar</h2>
          </div>
          {activeSoundscape && (
            <span className="text-xs font-outfit text-[#006947] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00855b] animate-pulse" />
              Tocando
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SOUNDSCAPES.map((s) => {
            const isPlaying = activeSoundscape === s.id;
            return (
              <button
                key={s.id}
                onClick={() => toggleSoundscape(s.id)}
                aria-pressed={isPlaying}
                className={`p-3.5 rounded-2xl text-left flex items-center justify-between gap-2 transition-all active:scale-[0.98] border ${
                  isPlaying
                    ? 'bg-[#e9ddff] border-[#6b38d4]/30'
                    : 'bg-[#eff4ff] border-transparent hover:bg-[#e5eeff]'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isPlaying ? 'bg-[#6b38d4] text-white' : 'bg-white text-[#494454]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[1.375rem]">{s.icon}</span>
                  </span>
                  <span className="flex flex-col min-w-0">
                    <span className="font-sora text-sm font-bold text-[#0b1c30] truncate">{s.name}</span>
                    <span className="font-outfit text-xs text-[#494454] truncate">{s.detail}</span>
                  </span>
                </span>
                <span
                  className={`material-symbols-outlined text-[1.6875rem] shrink-0 ${
                    isPlaying ? 'text-[#6b38d4] fill-1' : 'text-[#7b7486]'
                  }`}
                >
                  {isPlaying ? 'pause_circle' : 'play_circle'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* SOS */}
      <section className="p-4 rounded-3xl bg-[#ffdad6]/60 border border-[#ffdad6] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[1.375rem] fill-1">shield_with_heart</span>
          </div>
          <div className="min-w-0">
            <h2 className="font-sora text-sm font-bold text-[#ba1a1a]">
              Precisa de acolhimento agora?
            </h2>
            <p className="font-outfit text-sm text-[#494454]">
              Canal sigiloso 24 horas, com atendimento humano.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSOS}
          className="h-11 px-5 rounded-full bg-[#ba1a1a] text-white font-outfit text-sm font-bold hover:bg-[#93000a] shrink-0 active:scale-95 transition-all"
        >
          Abrir SOS
        </button>
      </section>
    </div>
  );
};
