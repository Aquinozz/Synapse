import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/audio';

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  technique?: '478' | 'box';
}

export const BreathingModal: React.FC<BreathingModalProps> = ({
  isOpen,
  onClose,
  technique = '478',
}) => {
  const [phase, setPhase] = useState<'inspire' | 'hold' | 'expire' | 'holdEmpty'>('inspire');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cycleCount, setCycleCount] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration for 4-7-8: Inspire 4s, Segure 7s, Expire 8s
  // Configuration for Box: Inspire 4s, Segure 4s, Expire 4s, Segure 4s
  useEffect(() => {
    if (!isOpen || !isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const runPacing = () => {
      setSecondsLeft((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        // Phase transitions
        if (technique === '478') {
          if (phase === 'inspire') {
            setPhase('hold');
            if (soundEnabled) sound.playChime('hold');
            return 7;
          } else if (phase === 'hold') {
            setPhase('expire');
            if (soundEnabled) sound.playChime('breatheOut');
            return 8;
          } else {
            setPhase('inspire');
            setCycleCount((c) => c + 1);
            if (soundEnabled) sound.playChime('breatheIn');
            return 4;
          }
        } else {
          // Box
          if (phase === 'inspire') {
            setPhase('hold');
            if (soundEnabled) sound.playChime('hold');
            return 4;
          } else if (phase === 'hold') {
            setPhase('expire');
            if (soundEnabled) sound.playChime('breatheOut');
            return 4;
          } else if (phase === 'expire') {
            setPhase('holdEmpty');
            if (soundEnabled) sound.playChime('hold');
            return 4;
          } else {
            setPhase('inspire');
            setCycleCount((c) => c + 1);
            if (soundEnabled) sound.playChime('breatheIn');
            return 4;
          }
        }
      });
    };

    timerRef.current = setInterval(runPacing, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isActive, phase, technique, soundEnabled]);

  if (!isOpen) return null;

  const phaseDetails = {
    inspire: {
      label: 'Inspire pelo nariz',
      sub: 'Encha o abdômen e expanda as costelas',
      color: 'from-[#6b38d4] to-[#8455ef]',
      scale: 'scale-125',
      ringColor: 'border-[#8455ef]',
    },
    hold: {
      label: 'Segure suavemente',
      sub: 'Relaxe o maxilar e mantenha os ombros soltos',
      color: 'from-[#0051d5] to-[#316bf3]',
      scale: 'scale-125',
      ringColor: 'border-[#316bf3]',
    },
    expire: {
      label: 'Expire pela boca',
      sub: 'Esvazie completamente soltando todo o peso',
      color: 'from-[#00855b] to-[#4edea3]',
      scale: 'scale-90',
      ringColor: 'border-[#4edea3]',
    },
    holdEmpty: {
      label: 'Aquiete a mente',
      sub: 'Permaneça em repouso neutro',
      color: 'from-[#494454] to-[#7b7486]',
      scale: 'scale-90',
      ringColor: 'border-[#7b7486]',
    },
  }[phase];

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1c30]/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#f8f9ff] w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center relative overflow-hidden border border-white">
        {/* Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#8455ef]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[#4edea3]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Controls */}
        <div className="w-full flex items-center justify-between z-10 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#6b38d4]">air</span>
            <span className="font-sora text-[13px] font-bold text-[#0b1c30]">
              Respiração {technique === '478' ? '4-7-8' : 'Box Pacer'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-label="Alternar som"
              className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#494454] hover:text-[#0b1c30]"
            >
              <span className="material-symbols-outlined text-[18px]">
                {soundEnabled ? 'volume_up' : 'volume_off'}
              </span>
            </button>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#494454] hover:text-[#0b1c30]"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Cycle indicator */}
        <div className="text-[12px] font-outfit text-[#494454] mb-4">
          Ciclo <strong className="text-[#6b38d4]">{cycleCount}</strong> de 4 · Relaxamento Nervo Vago
        </div>

        {/* Breathing Animation Canvas / Rings */}
        <div className="relative w-56 h-56 my-4 flex items-center justify-center">
          {/* Outer Pulsing Waves */}
          <div
            className={`absolute inset-0 rounded-full border-2 ${phaseDetails.ringColor} opacity-30 transition-transform duration-1000 ease-out ${
              phase === 'inspire' ? 'animate-ping' : ''
            }`}
          />
          <div
            className={`absolute inset-4 rounded-full border border-dashed ${phaseDetails.ringColor} opacity-50 transition-all duration-700 ${phaseDetails.scale}`}
          />

          {/* Central Sphere */}
          <div
            className={`w-36 h-36 rounded-full bg-gradient-to-tr ${phaseDetails.color} shadow-xl flex flex-col items-center justify-center text-white transition-all duration-1000 ease-in-out ${phaseDetails.scale}`}
          >
            <span className="font-sora text-4xl font-bold tracking-tight">
              {secondsLeft}s
            </span>
            <span className="text-[10px] font-outfit font-semibold uppercase tracking-wider opacity-90">
              {phase === 'inspire'
                ? 'Inspire'
                : phase === 'hold'
                ? 'Segure'
                : phase === 'expire'
                ? 'Expire'
                : 'Aquiete'}
            </span>
          </div>
        </div>

        {/* Instruction Text */}
        <div className="text-center my-3 min-h-[52px]">
          <h4 className="font-sora text-base font-bold text-[#0b1c30]">
            {phaseDetails.label}
          </h4>
          <p className="font-outfit text-[13px] text-[#494454] mt-0.5 leading-snug">
            {phaseDetails.sub}
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="w-full flex items-center gap-2 mt-2">
          <button
            onClick={() => setIsActive(!isActive)}
            className="flex-1 h-11 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isActive ? 'pause' : 'play_arrow'}
            </span>
            <span>{isActive ? 'Pausar' : 'Retomar'}</span>
          </button>
          <button
            onClick={onClose}
            className="h-11 px-4 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-outfit text-sm font-medium transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
