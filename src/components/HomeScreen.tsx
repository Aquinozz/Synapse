import React, { useState } from 'react';
import { IMAGES } from '../constants/images';
import { sound } from '../utils/audio';

interface HomeScreenProps {
  onStartAssessment: () => void;
  onOpenBreathing: (technique?: '478' | 'box') => void;
  onOpenSOS: () => void;
  onOpenVideoRoom: () => void;
  onOpenTherapistProfile: (id: string) => void;
  isDiscretionActive: boolean;
  onToggleDiscretion: () => void;
  currentWellnessScore?: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartAssessment,
  onOpenBreathing,
  onOpenSOS,
  onOpenVideoRoom,
  onOpenTherapistProfile,
  isDiscretionActive,
  onToggleDiscretion,
  currentWellnessScore = 84,
}) => {
  const [selectedMood, setSelectedMood] = useState<'exhausted' | 'tense' | 'serene' | 'focused' | 'energetic'>('serene');
  const [moodToast, setMoodToast] = useState<string | null>(null);

  const moods = [
    { id: 'exhausted', emoji: '😴', label: 'Exausta' },
    { id: 'tense', emoji: '⚡', label: 'Tensa' },
    { id: 'serene', emoji: '🌱', label: 'Serena' },
    { id: 'focused', emoji: '✨', label: 'Focada' },
    { id: 'energetic', emoji: '🚀', label: 'Energia' },
  ] as const;

  const handleMoodSelect = (id: typeof selectedMood, label: string) => {
    setSelectedMood(id);
    sound.playChime('click');
    setMoodToast(`Momento "${label}" registrado no seu diário seguro.`);
    setTimeout(() => setMoodToast(null), 2500);
  };

  // SVG Gauge calculations
  // Circumference = 2 * PI * 38 ≈ 238.76
  const gaugeCircumference = 238.76;
  const strokeDashoffset = gaugeCircumference - (gaugeCircumference * currentWellnessScore) / 100;

  return (
    <div className={`flex flex-col w-full px-4 pb-28 pt-20 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto space-y-4 ${isDiscretionActive ? 'discretion-blur' : ''}`}>
      {/* Toast Alert */}
      {moodToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#0b1c30] text-white text-xs font-outfit shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-[16px] text-[#4edea3]">check_circle</span>
          <span>{moodToast}</span>
        </div>
      )}

      {/* Acolhimento & Blindagem LGPD */}
      <section className="flex flex-col space-y-2 pt-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dbe1ff]/60 w-fit">
          <span className="material-symbols-outlined text-[15px] text-[#003ea8] fill-1">
            verified_user
          </span>
          <span className="font-outfit text-xs text-[#003ea8] font-semibold tracking-wide">
            Privacidade Ativa: 100% Anônimo para a Empresa
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="font-sora text-2xl font-bold text-[#0b1c30] tracking-tight">
              Olá, Marina ✨
            </h1>
            <p className="font-outfit text-sm text-[#494454]">
              Como está sua energia mental hoje?
            </p>
          </div>

          {/* Quick Discretion Shade Button */}
          <button
            onClick={onToggleDiscretion}
            aria-label={isDiscretionActive ? 'Remover desfoque de privacidade' : 'Ocultar tela por privacidade'}
            className="w-10 h-10 rounded-full bg-[#e5eeff] flex items-center justify-center text-[#494454] hover:text-[#6b38d4] active:scale-95 transition-all shadow-sm"
            title="Discretion Shade: clique para ocultar dados da tela"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isDiscretionActive ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        </div>
      </section>

      {/* Card Destaque: Índice de Bem-Estar */}
      <section className="bg-white rounded-3xl p-5 shadow-sm relative overflow-hidden border border-black/[0.03]">
        <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-[#e9ddff]/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -top-6 w-28 h-28 bg-[#6ffbbe]/25 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#e9ddff] flex items-center justify-center text-[#6b38d4]">
                <span className="material-symbols-outlined text-[18px]">psychology</span>
              </div>
              <span className="font-outfit text-sm font-semibold text-[#0b1c30]">
                Índice de Bem-Estar
              </span>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f5fff6] text-[#006947] border border-[#6ffbbe]/30">
              <span className="material-symbols-outlined text-[14px] fill-1">check_circle</span>
              <span className="font-outfit text-xs font-semibold">Saudável</span>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            {/* SVG Gauge Circular */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
                <circle
                  className="text-[#e5eeff]"
                  cx="48"
                  cy="48"
                  fill="transparent"
                  r="38"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  className="text-[#00855b]"
                  cx="48"
                  cy="48"
                  fill="transparent"
                  r="38"
                  stroke="currentColor"
                  strokeDasharray={gaugeCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  strokeWidth="8"
                  style={{ transition: 'stroke-dashoffset 1.4s ease-out' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="font-sora text-[28px] font-bold text-[#0b1c30] leading-none">
                  {currentWellnessScore}
                </span>
                <span className="font-outfit text-[10px] text-[#494454] font-medium">
                  / 100
                </span>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-1 text-[#006947] font-outfit text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span>+12% nesta semana</span>
              </div>
              <p className="font-outfit text-xs text-[#494454] leading-snug">
                Sua clareza mental e autorregulação evoluíram com a frequência nas pausas de respiração.
              </p>
            </div>
          </div>

          {/* Quick Mood Check Emojis */}
          <div className="pt-2">
            <p className="font-outfit text-xs text-[#494454] mb-1.5 font-medium">
              Registro rápido do seu momento:
            </p>
            <div className="flex items-center justify-between gap-1 bg-[#eff4ff] p-1.5 rounded-full">
              {moods.map((m) => {
                const isSelected = selectedMood === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleMoodSelect(m.id, m.label)}
                    className={`flex-1 py-1.5 rounded-full flex flex-col items-center justify-center transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-white shadow-sm text-[#6b38d4] font-semibold'
                        : 'hover:bg-white/60 text-[#494454]'
                    }`}
                  >
                    <span className="text-base">{m.emoji}</span>
                    <span
                      className={`font-outfit text-[9px] mt-0.5 ${
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
        </div>
      </section>

      {/* Ações Rápidas */}
      <section className="flex flex-col space-y-2">
        <button
          onClick={onStartAssessment}
          className="w-full h-12 rounded-full bg-gradient-to-r from-[#316bf3] to-[#6b38d4] hover:opacity-95 flex items-center justify-center gap-2 text-white font-outfit text-sm font-semibold shadow-md active:scale-[0.99] transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">fact_check</span>
          <span>Fazer Check-in Diário (2 min)</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onOpenBreathing('478')}
            className="h-11 rounded-full bg-[#eff4ff] hover:bg-[#e5eeff] flex items-center justify-center gap-2 text-[#0b1c30] font-outfit text-xs font-semibold active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-[#006947]">air</span>
            <span>Pausa Guiada (5m)</span>
          </button>

          <button
            onClick={onOpenSOS}
            className="h-11 rounded-full bg-[#ffdad6]/60 hover:bg-[#ffdad6] flex items-center justify-center gap-1.5 text-[#ba1a1a] font-outfit text-xs font-semibold active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-[#ba1a1a] fill-1">
              shield_with_heart
            </span>
            <span>SOS Acolhimento</span>
          </button>
        </div>
      </section>

      {/* Próxima Sessão Confirmada */}
      <section className="bg-white rounded-3xl p-5 shadow-sm relative overflow-hidden border border-black/[0.03]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-outfit text-[11px] font-bold tracking-wider text-[#0051d5] uppercase">
            Compromisso Hoje
          </span>
          <div className="flex items-center gap-1 text-[#494454] font-outfit text-xs">
            <span className="w-2 h-2 rounded-full bg-[#00855b] animate-pulse" />
            <span id="countdown-timer">Em 1h 42m</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <img
            src={IMAGES.camila}
            alt="Dra. Camila Rossi"
            className="w-12 h-12 rounded-full object-cover shrink-0 shadow-sm border border-[#e5eeff]"
          />
          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="font-sora text-base font-bold text-[#0b1c30] truncate">
              Sessão com Dra. Camila
            </h2>
            <p className="font-outfit text-xs text-[#494454]">
              Consulta Terapêutica • 16:30
            </p>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-[#eff4ff] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-[#494454] font-outfit text-xs">
            <span className="material-symbols-outlined text-[15px] text-[#006947]">lock</span>
            <span>Criptografia ponta a ponta</span>
          </div>
          <button
            onClick={onOpenVideoRoom}
            className="px-4 py-2 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-xs font-semibold active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">video_camera_front</span>
            <span>Acessar Sala Segura</span>
          </button>
        </div>
      </section>

      {/* Recomendações Inteligentes (Synapse AI) */}
      <section className="flex flex-col space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#6b38d4]">neurology</span>
            <h2 className="font-outfit text-sm font-semibold text-[#0b1c30]">
              Sugestão Synapse AI
            </h2>
          </div>
          <span className="font-outfit text-xs text-[#494454]">Baseado no seu padrão</span>
        </div>

        <div
          onClick={() => onOpenBreathing('478')}
          className="bg-[#eff4ff] hover:bg-[#e5eeff] rounded-2xl p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer border border-[#dce9ff]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#8455ef]/20 flex items-center justify-center text-[#6b38d4] shrink-0">
              <span className="material-symbols-outlined text-[20px]">air</span>
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="font-sora text-sm text-[#0b1c30] font-semibold truncate">
                Respiração 4-7-8 para Foco
              </h3>
              <p className="font-outfit text-xs text-[#494454] truncate">
                Ideal para desacelerar o ritmo cardíaco antes da reunião
              </p>
            </div>
          </div>
          <button
            aria-label="Iniciar exercício"
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#6b38d4] shrink-0 shadow-sm hover:scale-105 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
          </button>
        </div>
      </section>

      {/* Especialista em Destaque */}
      <section className="bg-white rounded-3xl p-5 shadow-sm flex flex-col space-y-3 border border-black/[0.03]">
        <div className="flex items-center justify-between">
          <span className="font-outfit text-xs font-semibold uppercase tracking-wider text-[#494454]">
            Terapeuta Responsável
          </span>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#dbe1ff]/60 text-[#00174b]">
            <span className="material-symbols-outlined text-[12px] text-[#0051d5]">verified</span>
            <span className="font-outfit text-[10px] font-semibold">
              Plano Corporativo 100% Coberto
            </span>
          </div>
        </div>

        <div
          onClick={() => onOpenTherapistProfile('camila')}
          className="flex items-center gap-4 cursor-pointer hover:opacity-95 transition-opacity"
        >
          <div className="relative shrink-0">
            <img
              src={IMAGES.camila}
              alt="Dra. Camila Rossi"
              className="w-14 h-14 rounded-full object-cover border border-[#e5eeff]"
            />
            <span
              className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#00855b] ring-2 ring-white"
              title="Disponível"
            />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="font-sora text-sm font-bold text-[#0b1c30]">
              Dra. Camila Rossi
            </h3>
            <p className="font-outfit text-xs text-[#494454]">
              CRP 06/142981 • Burnout & Ansiedade
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex items-center text-amber-500">
                <span className="material-symbols-outlined text-[14px] fill-1">star</span>
                <span className="font-outfit text-xs font-bold ml-0.5 text-[#0b1c30]">4.9</span>
              </div>
              <span className="font-outfit text-[11px] text-[#494454]">
                • 120 avaliações acolhedoras
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Histórico & Linha do Tempo Semanal */}
      <section className="bg-white rounded-3xl p-5 shadow-sm flex flex-col space-y-2 border border-black/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#494454]">
              calendar_view_week
            </span>
            <h3 className="font-outfit text-sm font-semibold text-[#0b1c30]">
              Evolução Semanal
            </h3>
          </div>
          <span className="font-outfit text-xs text-[#006947] font-semibold">
            6 de 7 dias ativos
          </span>
        </div>

        {/* Mini Visualizador de Tendência */}
        <div className="pt-2">
          <div className="flex items-end justify-between h-20 px-2 gap-2">
            {[
              { day: 'Seg', h: 'h-10' },
              { day: 'Ter', h: 'h-12' },
              { day: 'Qua', h: 'h-11' },
              { day: 'Qui', h: 'h-14' },
              { day: 'Sex', h: 'h-13' },
              { day: 'Hoje', h: 'h-16', active: true },
              { day: 'Dom', h: 'h-6', dashed: true },
            ].map((col, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-full rounded-t-full transition-all ${col.h} ${
                    col.active
                      ? 'bg-[#6b38d4] shadow-sm'
                      : col.dashed
                      ? 'bg-[#eff4ff] border-dashed border border-[#cbc3d7]'
                      : 'bg-[#e5eeff] hover:bg-[#e9ddff]'
                  }`}
                />
                <span
                  className={`font-outfit text-[10px] ${
                    col.active
                      ? 'font-bold text-[#6b38d4]'
                      : col.dashed
                      ? 'text-[#7b7486]'
                      : 'text-[#494454]'
                  }`}
                >
                  {col.day}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
