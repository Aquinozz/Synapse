import React, { useState, useEffect } from 'react';
import { sound } from '../utils/audio';
import { Modal, ModalCloseButton } from './Modal';

type Technique = '478' | 'box';
type PhaseId = 'inspire' | 'hold' | 'expire' | 'holdEmpty';

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  technique?: Technique;
  /** Called once when all cycles are finished */
  onComplete?: (technique: Technique) => void;
}

const TOTAL_CYCLES = 4;

// 4-7-8: Inspire 4s, Segure 7s, Expire 8s
// Box: Inspire 4s, Segure 4s, Expire 4s, Segure 4s
const SEQUENCES: Record<Technique, { phase: PhaseId; seconds: number }[]> = {
  '478': [
    { phase: 'inspire', seconds: 4 },
    { phase: 'hold', seconds: 7 },
    { phase: 'expire', seconds: 8 },
  ],
  box: [
    { phase: 'inspire', seconds: 4 },
    { phase: 'hold', seconds: 4 },
    { phase: 'expire', seconds: 4 },
    { phase: 'holdEmpty', seconds: 4 },
  ],
};

const PHASE_DETAILS: Record<
  PhaseId,
  {
    short: string;
    label: string;
    sub: string;
    color: string;
    scale: string;
    ringColor: string;
    chime: 'breatheIn' | 'hold' | 'breatheOut';
  }
> = {
  inspire: {
    short: 'Inspire',
    label: 'Inspire pelo nariz',
    sub: 'Encha o abdômen e expanda as costelas',
    color: 'from-[#6b38d4] to-[#8455ef]',
    scale: 'scale-125',
    ringColor: 'border-[#8455ef]',
    chime: 'breatheIn',
  },
  hold: {
    short: 'Segure',
    label: 'Segure suavemente',
    sub: 'Relaxe o maxilar e mantenha os ombros soltos',
    color: 'from-[#0051d5] to-[#316bf3]',
    scale: 'scale-125',
    ringColor: 'border-[#316bf3]',
    chime: 'hold',
  },
  expire: {
    short: 'Expire',
    label: 'Expire pela boca',
    sub: 'Esvazie completamente soltando todo o peso',
    color: 'from-[#00855b] to-[#4edea3]',
    scale: 'scale-90',
    ringColor: 'border-[#4edea3]',
    chime: 'breatheOut',
  },
  holdEmpty: {
    short: 'Aquiete',
    label: 'Aquiete a mente',
    sub: 'Permaneça em repouso neutro',
    color: 'from-[#494454] to-[#7b7486]',
    scale: 'scale-90',
    ringColor: 'border-[#7b7486]',
    chime: 'hold',
  },
};

export const BreathingModal: React.FC<BreathingModalProps> = ({
  isOpen,
  onClose,
  technique = '478',
  onComplete,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    label={`Respiração guiada ${technique === '478' ? '4-7-8' : 'quadrada'}`}
    maxWidth="max-w-sm"
    className="!bg-[#f8f9ff] items-center overflow-x-hidden"
    dimmed
  >
    <BreathingContent technique={technique} onClose={onClose} onComplete={onComplete} />
  </Modal>
);

const BreathingContent: React.FC<{
  technique: Technique;
  onClose: () => void;
  onComplete?: (technique: Technique) => void;
}> = ({ technique, onClose, onComplete }) => {
  const sequence = SEQUENCES[technique];
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(sequence[0].seconds);
  const [cycleCount, setCycleCount] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const current = sequence[phaseIndex];
  const details = PHASE_DETAILS[current.phase];

  // The sphere starts contracted and grows into the first inhale
  const [hasStarted, setHasStarted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setHasStarted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isActive || isFinished) return;

    const tick = setTimeout(() => {
      if (secondsLeft > 1) {
        setSecondsLeft(secondsLeft - 1);
        return;
      }

      const isLastPhase = phaseIndex === sequence.length - 1;
      if (isLastPhase && cycleCount === TOTAL_CYCLES) {
        setIsFinished(true);
        if (soundEnabled) sound.playChime('success');
        onComplete?.(technique);
        return;
      }

      const nextIndex = isLastPhase ? 0 : phaseIndex + 1;
      if (isLastPhase) setCycleCount(cycleCount + 1);
      setPhaseIndex(nextIndex);
      setSecondsLeft(sequence[nextIndex].seconds);
      if (soundEnabled) sound.playChime(PHASE_DETAILS[sequence[nextIndex].phase].chime);
    }, 1000);

    return () => clearTimeout(tick);
  }, [isActive, isFinished, secondsLeft, phaseIndex, cycleCount, sequence, soundEnabled, technique, onComplete]);

  const handleRestart = () => {
    setPhaseIndex(0);
    setSecondsLeft(sequence[0].seconds);
    setCycleCount(1);
    setIsFinished(false);
    setIsActive(true);
  };

  const techniqueName = technique === '478' ? '4-7-8' : 'Quadrada (Box)';
  const isMoving = current.phase === 'inspire' || current.phase === 'expire';

  return (
    <>
      {/* Ambient Glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#8455ef]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[#4edea3]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Controls */}
      <div className="w-full flex items-center justify-between z-10 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[1.25rem] text-[#6b38d4]">air</span>
          <span className="font-sora text-smd font-bold text-[#0b1c30]">
            Respiração {techniqueName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={soundEnabled ? 'Desativar som' : 'Ativar som'}
            aria-pressed={soundEnabled}
            className="w-10 h-10 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] flex items-center justify-center text-[#494454] hover:text-[#0b1c30] transition-colors"
          >
            <span className="material-symbols-outlined text-[1.375rem]">
              {soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
          </button>
          <ModalCloseButton onClose={onClose} />
        </div>
      </div>

      {isFinished ? (
        <div className="flex flex-col items-center text-center z-10 py-6 gap-2 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-[#f5fff6] text-[#00855b] flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-[2.5rem] fill-1">check_circle</span>
          </div>
          <h4 className="font-sora text-lg font-bold text-[#0b1c30] mt-1">
            Prática concluída
          </h4>
          <p className="font-outfit text-smd text-[#494454] leading-snug max-w-[260px]">
            Você completou {TOTAL_CYCLES} ciclos de respiração {techniqueName}. Observe como seu corpo está agora antes de voltar à rotina.
          </p>
        </div>
      ) : (
        <>
          {/* Cycle indicator */}
          <div className="flex flex-col items-center gap-1.5 z-10 mb-4">
            <div className="text-xs font-outfit text-[#494454]">
              Ciclo <strong className="text-[#6b38d4]">{cycleCount}</strong> de {TOTAL_CYCLES} · Relaxamento Nervo Vago
            </div>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {Array.from({ length: TOTAL_CYCLES }, (_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i + 1 < cycleCount
                      ? 'w-4 bg-[#00855b]'
                      : i + 1 === cycleCount
                      ? 'w-6 bg-[#6b38d4]'
                      : 'w-4 bg-[#dce9ff]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Breathing Animation Rings */}
          <div className="relative w-56 h-56 my-4 flex items-center justify-center z-10">
            <div
              className={`absolute inset-0 rounded-full border-2 ${details.ringColor} opacity-30 transition-colors duration-700`}
            />
            <div
              className={`absolute inset-4 rounded-full border border-dashed ${details.ringColor} opacity-50 transition-all ease-in-out ${
                hasStarted ? details.scale : 'scale-90'
              }`}
              style={{ transitionDuration: `${isMoving ? current.seconds * 1000 : 700}ms` }}
            />

            {/* Central Sphere: grows for the whole inhale, shrinks for the whole exhale */}
            <div
              className={`w-36 h-36 rounded-full bg-gradient-to-tr ${details.color} shadow-xl flex flex-col items-center justify-center text-white transition-transform ease-in-out ${
                hasStarted ? details.scale : 'scale-90'
              }`}
              style={{ transitionDuration: `${isMoving ? current.seconds * 1000 : 700}ms` }}
            >
              <span className="font-sora text-4xl font-bold tracking-tight tabular-nums">
                {secondsLeft}s
              </span>
              <span className="text-3xs font-outfit font-semibold uppercase tracking-wider opacity-90">
                {details.short}
              </span>
            </div>
          </div>

          {/* Instruction Text */}
          <div className="text-center my-3 min-h-[52px] z-10" aria-live="polite">
            <h4 className="font-sora text-base font-bold text-[#0b1c30]">
              {isActive ? details.label : 'Em pausa'}
            </h4>
            <p className="font-outfit text-smd text-[#494454] mt-0.5 leading-snug">
              {isActive ? details.sub : 'Retome quando quiser.'}
            </p>
          </div>
        </>
      )}

      {/* Bottom Actions */}
      <div className="w-full flex items-center gap-2 mt-2 z-10">
        {isFinished ? (
          <button
            onClick={handleRestart}
            className="flex-1 h-11 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-outfit text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[1.25rem]">replay</span>
            <span>Repetir</span>
          </button>
        ) : (
          <button
            onClick={() => setIsActive(!isActive)}
            className="flex-1 h-11 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[1.25rem]">
              {isActive ? 'pause' : 'play_arrow'}
            </span>
            <span>{isActive ? 'Pausar' : 'Retomar'}</span>
          </button>
        )}
        <button
          onClick={onClose}
          className={`h-11 px-5 rounded-full font-outfit text-sm transition-colors ${
            isFinished
              ? 'flex-1 bg-[#6b38d4] hover:bg-[#8455ef] text-white font-semibold shadow-sm'
              : 'bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-medium'
          }`}
        >
          {isFinished ? 'Concluir' : 'Encerrar'}
        </button>
      </div>
    </>
  );
};
