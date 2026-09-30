import React, { useState } from 'react';
import { sound } from '../utils/audio';

interface WellnessHubScreenProps {
  onOpenBreathing: (technique?: '478' | 'box') => void;
  onOpenSOS: () => void;
  onOpenSchedule: () => void;
  isDiscretionActive: boolean;
}

export const WellnessHubScreen: React.FC<WellnessHubScreenProps> = ({
  onOpenBreathing,
  onOpenSOS,
  onOpenSchedule,
  isDiscretionActive,
}) => {
  const [activeSoundscape, setActiveSoundscape] = useState<string | null>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>(['pacer-1']);

  const exercises = [
    {
      id: 'pacer-478',
      title: 'Respiração 4-7-8 para Foco',
      subtitle: 'Reduz a ativação simpática e diminui a frequência cardíaca.',
      duration: '3 min',
      category: 'Somatic',
      icon: 'air',
      action: () => onOpenBreathing('478'),
    },
    {
      id: 'pacer-box',
      title: 'Box Breathing (Respiração Quadrada)',
      subtitle: 'Usado para clareza mental rápida e estabilização pré-apresentações.',
      duration: '4 min',
      category: 'Foco',
      icon: 'grid_view',
      action: () => onOpenBreathing('box'),
    },
    {
      id: 'eye-2020',
      title: 'Regra Ocular 20-20-20',
      subtitle: 'A cada 20 min de tela, olhe a 20 pés (6m) por 20 segundos.',
      duration: '1 min',
      category: 'Ergonomia',
      icon: 'visibility',
      action: () => {
        sound.playChime('success');
        if (!completedExercises.includes('eye-2020')) {
          setCompletedExercises([...completedExercises, 'eye-2020']);
        }
        alert('Pausa visual iniciada: foque seu olhar no horizonte ou ponto distante por 20 segundos.');
      },
    },
    {
      id: 'neck-stretch',
      title: 'Descompressão Trapézio & Cervical',
      subtitle: 'Alongamento suave para liberar tensões acumuladas em digitação.',
      duration: '2 min',
      category: 'Somatic',
      icon: 'self_improvement',
      action: () => {
        sound.playChime('success');
        if (!completedExercises.includes('neck-stretch')) {
          setCompletedExercises([...completedExercises, 'neck-stretch']);
        }
        alert('Exercício ativado: incline a cabeça para a direita por 15s respirando fundo, e repita para a esquerda.');
      },
    },
  ];

  const soundscapes = [
    { id: 'binaural', name: 'Ondas Alfa (Foco Profundo)', icon: 'headphones', freq: '10Hz' },
    { id: 'rain', name: 'Chuva Restaurativa', icon: 'water_drop', freq: 'Ruído Rosa' },
    { id: 'forest', name: 'Brisa Silvestre', icon: 'forest', freq: 'Relaxamento' },
  ];

  const toggleSoundscape = (id: string) => {
    sound.playChime('click');
    if (activeSoundscape === id) {
      setActiveSoundscape(null);
    } else {
      setActiveSoundscape(id);
      sound.playChime('hold');
    }
  };

  return (
    <div
      className={`flex flex-col w-full px-4 pb-28 pt-20 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto space-y-4 ${
        isDiscretionActive ? 'discretion-blur' : ''
      }`}
    >
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-[#6b38d4] to-[#0051d5] rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-[20px] text-[#6ffbbe]">spa</span>
          <span className="font-outfit text-xs font-semibold uppercase tracking-wider text-[#dbe1ff]">
            Hub de Práticas Restaurativas
          </span>
        </div>
        <h2 className="font-sora text-xl font-bold tracking-tight">
          Práticas Somáticas & Foco
        </h2>
        <p className="font-outfit text-xs text-white/85 mt-1 leading-snug">
          Micro-intervenções baseadas em neurociência para descompressão e preservação da energia vital.
        </p>

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => onOpenBreathing('478')}
            className="px-4 py-2 rounded-full bg-white text-[#6b38d4] font-outfit text-xs font-bold hover:bg-[#f8f9ff] active:scale-95 transition-all shadow-sm"
          >
            Iniciar Respiração Guiada
          </button>
          <button
            onClick={onOpenSchedule}
            className="px-4 py-2 rounded-full bg-white/15 text-white font-outfit text-xs font-semibold hover:bg-white/25 active:scale-95 transition-all"
          >
            Consultar Terapeuta
          </button>
        </div>
      </section>

      {/* Soundscapes Ambientais */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-black/[0.04]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#6b38d4]">graphic_eq</span>
            <h3 className="font-sora text-base font-bold text-[#0b1c30]">
              Paisagens Sonoras Neurais
            </h3>
          </div>
          {activeSoundscape && (
            <span className="text-[11px] font-outfit text-[#00855b] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#00855b] animate-ping" />
              Em reprodução suave
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {soundscapes.map((s) => {
            const isPlaying = activeSoundscape === s.id;
            return (
              <button
                key={s.id}
                onClick={() => toggleSoundscape(s.id)}
                className={`p-3.5 rounded-2xl text-left flex items-center justify-between transition-all active:scale-95 ${
                  isPlaying
                    ? 'bg-[#e9ddff] border border-[#6b38d4]/30 shadow-xs'
                    : 'bg-[#eff4ff] hover:bg-[#e5eeff]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isPlaying ? 'bg-[#6b38d4] text-white' : 'bg-white text-[#494454]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                  </div>
                  <div>
                    <div className="font-sora text-xs font-bold text-[#0b1c30] truncate">
                      {s.name}
                    </div>
                    <div className="font-outfit text-[10px] text-[#494454]">{s.freq}</div>
                  </div>
                </div>
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isPlaying ? 'text-[#6b38d4]' : 'text-[#7b7486]'
                  }`}
                >
                  {isPlaying ? 'pause_circle' : 'play_circle'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Protocolos de Descompressão Somática */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#6b38d4]">
              self_improvement
            </span>
            <h3 className="font-sora text-base font-bold text-[#0b1c30]">
              Pausas Somáticas Diárias
            </h3>
          </div>
          <span className="font-outfit text-xs text-[#006947] font-semibold">
            {completedExercises.length} de {exercises.length} concluídas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {exercises.map((ex) => {
            const isDone = completedExercises.includes(ex.id);
            return (
              <div
                key={ex.id}
                onClick={ex.action}
                className="p-4 rounded-3xl bg-white hover:bg-[#f8f9ff] border border-black/[0.04] shadow-sm flex flex-col justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#eff4ff] group-hover:bg-[#e9ddff] text-[#6b38d4] flex items-center justify-center shrink-0 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">{ex.icon}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#494454] font-outfit text-[10px] font-semibold">
                      {ex.duration}
                    </span>
                    {isDone && (
                      <span className="material-symbols-outlined text-[#00855b] text-[18px] fill-1">
                        check_circle
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-sora text-sm font-bold text-[#0b1c30] group-hover:text-[#6b38d4] transition-colors">
                    {ex.title}
                  </h4>
                  <p className="font-outfit text-xs text-[#494454] mt-0.5 leading-snug">
                    {ex.subtitle}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-[#6b38d4] font-semibold font-outfit pt-1">
                  <span>Praticar agora</span>
                  <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SOS Banner */}
      <section className="p-4 rounded-3xl bg-[#ffdad6]/60 border border-[#ffdad6] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[20px] fill-1">shield_with_heart</span>
          </div>
          <div>
            <h4 className="font-sora text-sm font-bold text-[#ba1a1a]">
              Precisa de acolhimento imediato?
            </h4>
            <p className="font-outfit text-xs text-[#494454]">
              Canal sigiloso 24 horas por dia com suporte humanizado.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSOS}
          className="px-4 py-2 rounded-full bg-[#ba1a1a] text-white font-outfit text-xs font-bold hover:bg-[#93000a] shrink-0 active:scale-95 transition-all shadow-sm"
        >
          SOS Agora
        </button>
      </section>
    </div>
  );
};
