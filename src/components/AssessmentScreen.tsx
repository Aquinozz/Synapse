import React, { useState } from 'react';
import { IMAGES } from '../constants/images';
import { Logo } from './Logo';
import { sound } from '../utils/audio';
import { CognitiveLoadLevel } from '../types';

interface AssessmentScreenProps {
  onBack: () => void;
  onFinish: (newScore: number) => void;
}

export const AssessmentScreen: React.FC<AssessmentScreenProps> = ({
  onBack,
  onFinish,
}) => {
  const [currentStep, setCurrentStep] = useState(3); // Defaulting to step 3 to match the screenshot!
  const [cognitiveLoad, setCognitiveLoad] = useState<CognitiveLoadLevel>('balanced');
  const [energyLevel, setEnergyLevel] = useState<number>(7);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([
    'Muitas reuniões',
    'Boa colaboração no time',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [customFactorInput, setCustomFactorInput] = useState('');
  const [showAddFactor, setShowAddFactor] = useState(false);
  const [somaticCountdown, setSomaticCountdown] = useState<number | null>(null);

  // Energy text and tone
  const getEnergyDetails = (val: number) => {
    if (val <= 2) {
      return {
        label: 'Esgotamento Total',
        color: 'text-[#ba1a1a]',
        feedback: 'Atenção especial recomendada. Seu nível de cortisol pode estar elevado.',
        icon: 'error',
      };
    } else if (val <= 4) {
      return {
        label: 'Baixa Reserva',
        color: 'text-[#c05621]',
        feedback: 'Ritmo mental sob tensão. Programar micro-pausas é essencial hoje.',
        icon: 'warning',
      };
    } else if (val <= 6) {
      return {
        label: 'Estável / Neutro',
        color: 'text-[#0051d5]',
        feedback: 'Fluxo moderado sustentável. Boa oportunidade para manter bons limites.',
        icon: 'info',
      };
    } else if (val <= 8) {
      return {
        label: 'Energia Positiva',
        color: 'text-[#6b38d4]',
        feedback: 'Excelente pontuação. Seus índices de neuro-recuperação estão estáveis nas últimas 72h.',
        icon: 'check_circle',
      };
    } else {
      return {
        label: 'Pleno Vigor',
        color: 'text-[#00855b]',
        feedback: 'Alta resiliência e clareza cognitiva. Aproveite o foco criativo.',
        icon: 'verified',
      };
    }
  };

  const energyDetails = getEnergyDetails(energyLevel);
  const sliderPercentage = ((energyLevel - 1) / 9) * 100;

  const defaultFactors = [
    { id: 'deadlines', label: 'Prazos curtos', icon: 'timer' },
    { id: 'meetings', label: 'Muitas reuniões', icon: 'groups' },
    { id: 'sleep_off', label: 'Dificuldade para desligar à noite', icon: 'bedtime_off' },
    { id: 'collaboration', label: 'Boa colaboração no time', icon: 'favorite' },
    { id: 'feedback', label: 'Feedback positivo recebido', icon: 'thumb_up' },
  ];

  const toggleFactor = (label: string) => {
    sound.playChime('click');
    if (selectedFactors.includes(label)) {
      setSelectedFactors(selectedFactors.filter((f) => f !== label));
    } else {
      setSelectedFactors([...selectedFactors, label]);
    }
  };

  const handleAddCustomFactor = (e: React.FormEvent) => {
    e.preventDefault();
    if (customFactorInput.trim() && !selectedFactors.includes(customFactorInput.trim())) {
      setSelectedFactors([...selectedFactors, customFactorInput.trim()]);
      setCustomFactorInput('');
      setShowAddFactor(false);
      sound.playChime('click');
    }
  };

  const startSomaticBreath = () => {
    setSomaticCountdown(4);
    sound.playChime('breatheOut');
    const timer = setInterval(() => {
      setSomaticCountdown((prev) => {
        if (prev !== null && prev > 1) {
          return prev - 1;
        }
        clearInterval(timer);
        sound.playChime('success');
        return null;
      });
    }, 1000);
  };

  const handleNextStep = () => {
    sound.playChime('click');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      if (currentStep < 5) {
        setCurrentStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Assessment finished
        setIsCompleted(true);
        sound.playChime('success');
      }
    }, 500);
  };

  const calculateFinalScore = () => {
    // Calculates score based on choices
    let score = 70;
    if (cognitiveLoad === 'calm') score += 15;
    else if (cognitiveLoad === 'balanced') score += 10;
    else if (cognitiveLoad === 'tired') score -= 5;
    else if (cognitiveLoad === 'exhausted') score -= 20;

    score += Math.round((energyLevel - 5) * 2.5);
    return Math.min(98, Math.max(45, score));
  };

  const handleSaveLater = () => {
    sound.playChime('click');
    alert('Progresso salvo de forma confidencial. Você pode retornar a qualquer momento.');
    onBack();
  };

  const stepTitles: Record<number, { category: string; question: string; nextBtn: string }> = {
    1: {
      category: '01 FOCO & ATENÇÃO',
      question: 'Como tem sido sua capacidade de concentração em tarefas contínuas?',
      nextBtn: 'Continuar para Relações & Equipe',
    },
    2: {
      category: '02 CLIMA & SEGURANÇA',
      question: 'Você sente que possui espaço seguro para expressar desafios e limites no trabalho?',
      nextBtn: 'Continuar para Carga Cognitiva',
    },
    3: {
      category: '03 CARGA COGNITIVA',
      question: 'Como você avalia sua sobrecarga de trabalho e ritmo mental nas últimas 48 horas?',
      nextBtn: 'Continuar para Sono & Descanso',
    },
    4: {
      category: '04 SONO & RECUPERAÇÃO',
      question: 'Como foi a qualidade do seu repouso e desconexão mental na última noite?',
      nextBtn: 'Continuar para Sintomas Somáticos',
    },
    5: {
      category: '05 AUTOCUIDADO & CONCLUSÃO',
      question: 'Quais recursos restaurativos seriam mais valiosos para sua rotina nesta semana?',
      nextBtn: 'Finalizar Avaliação Confidencial',
    },
  };

  const currentInfo = stepTitles[currentStep] || stepTitles[3];
  const progressPercent = currentStep * 20;

  return (
    <div className="flex-1 flex flex-col relative w-full min-h-screen bg-[#f8f9ff]">
      {/* Top Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#f8f9ff]/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] pt-[env(safe-area-inset-top,0px)]">
        <div className="h-16 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              aria-label="Voltar"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#0b1c30] hover:bg-[#eff4ff] active:bg-[#dce9ff] transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <Logo size={28} className="hidden xs:inline-block" />
            <h1 className="font-sora text-base sm:text-lg text-[#0b1c30] font-bold tracking-tight truncate max-w-[170px] xs:max-w-[240px]">
              Avaliação De Burnout
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#dbe1ff]/60">
              <span className="material-symbols-outlined text-[11px] text-[#003ea8] font-bold">
                lock
              </span>
              <span className="font-outfit text-[10px] leading-none text-[#003ea8] font-semibold uppercase">
                Privado
              </span>
            </div>

            <div className="min-w-[44px] min-h-[44px] flex items-center justify-center">
              <img
                src={IMAGES.userMarina}
                alt="Marina"
                className="w-8 h-8 rounded-full object-cover shadow-[0_2px_8px_-2px_rgba(15,23,42,0.12)] border border-white"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto pt-20 pb-36 px-4">
        {isCompleted ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center my-auto animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-[#f5fff6] text-[#00855b] flex items-center justify-center shadow-inner mb-3">
              <span className="material-symbols-outlined text-[36px] fill-1">verified</span>
            </div>

            <span className="font-outfit text-xs font-bold uppercase tracking-wider text-[#00855b]">
              Check-in Concluído com Sucesso
            </span>
            <h2 className="font-sora text-2xl font-bold text-[#0b1c30] mt-1">
              Seu Diagnóstico Neuro-Funcional
            </h2>

            <div className="my-5 p-4 rounded-2xl bg-[#eff4ff] w-full text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-outfit text-xs text-[#494454] font-medium">Novo Índice de Bem-Estar</span>
                <span className="font-sora text-xl font-bold text-[#6b38d4]">
                  {calculateFinalScore()}/100
                </span>
              </div>
              <p className="font-outfit text-xs text-[#0b1c30] leading-relaxed">
                Suas respostas foram criptografadas e adicionadas de forma 100% anônima ao índice global da empresa. Seu perfil indica boa capacidade de autorregulação com foco pontual em redução de sobrecarga comunicacional.
              </p>
            </div>

            <div className="w-full space-y-2 mb-4 text-left">
              <span className="font-sora text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                Prescrições Imediatas Sugeridas
              </span>
              <div className="p-3 bg-[#f8f9ff] rounded-xl border border-[#e5eeff] text-xs text-[#494454] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00855b] text-[18px]">spa</span>
                <span>Pausa guiada de respiração diafragmática 4-7-8 antes das 18h.</span>
              </div>
              <div className="p-3 bg-[#f8f9ff] rounded-xl border border-[#e5eeff] text-xs text-[#494454] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6b38d4] text-[18px]">event_available</span>
                <span>Sua consulta com Dra. Camila está confirmada para hoje às 16:30.</span>
              </div>
            </div>

            <button
              onClick={() => onFinish(calculateFinalScore())}
              className="w-full h-12 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-bold shadow-md transition-all active:scale-95"
            >
              Voltar ao Início com Dados Atualizados
            </button>
          </div>
        ) : (
          <div className="flex flex-col w-full space-y-5">
            {/* Step Progress Bar */}
            <div className="pt-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-outfit text-xs text-[#6b38d4] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#6b38d4] animate-pulse" />
                  Etapa {currentStep} de 5 ({progressPercent}%)
                </span>
                <span className="font-outfit text-xs text-[#494454] font-medium">
                  Tempo estimado: 1 min
                </span>
              </div>

              <div className="w-full h-2.5 bg-[#dce9ff] rounded-full overflow-hidden relative shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[#316bf3] via-[#6b38d4] to-[#00855b] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="font-outfit text-xs text-[#494454] flex items-center gap-1.5 mt-0.5">
                <span className="material-symbols-outlined text-[16px] text-[#006947]">spa</span>
                <span>Sem respostas certas ou erradas. Respire fundo e sinta seu momento.</span>
              </p>
            </div>

            {/* Privacy Guarantee Box */}
            <div className="bg-[#eff4ff] rounded-2xl p-4 shadow-sm flex items-start gap-3 border border-[#dce9ff]">
              <div className="w-9 h-9 rounded-full bg-[#dbe1ff] flex items-center justify-center shrink-0 text-[#0051d5] mt-0.5">
                <span className="material-symbols-outlined text-[20px] fill-1">
                  enhanced_encryption
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-outfit text-xs font-bold text-[#0b1c30]">
                    Proteção LGPD & Anonimato Absoluto
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#6ffbbe] text-[#002113] font-outfit text-[10px] uppercase font-bold">
                    100% Seguro
                  </span>
                </div>
                <p className="font-outfit text-xs text-[#494454] mt-0.5 leading-snug">
                  Suas respostas individuais <strong>nunca são compartilhadas com RH ou gestores</strong>. Os dados compõem apenas índices globais anonimizados de resiliência.
                </p>
              </div>
            </div>

            {/* Question Title */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#e9ddff] text-[#23005c] font-outfit text-xs flex items-center justify-center font-bold">
                  {currentStep.toString().padStart(2, '0')}
                </span>
                <span className="font-outfit text-xs text-[#6b38d4] uppercase font-bold tracking-wider">
                  {currentInfo.category.split(' ').slice(1).join(' ')}
                </span>
              </div>
              <h2 className="font-sora text-xl sm:text-2xl text-[#0b1c30] font-semibold tracking-tight leading-snug">
                {currentInfo.question}
              </h2>
              <p className="font-outfit text-xs text-[#494454]">
                Identificar os primeiros sinais de fadiga é o passo primordial para restaurar sua clareza.
              </p>
            </div>

            {/* Burnout Cognitive Load Radio Group */}
            <div
              className="flex flex-col gap-2.5"
              role="radiogroup"
              aria-label="Avaliação de sobrecarga mental"
            >
              {[
                {
                  id: 'calm' as CognitiveLoadLevel,
                  emoji: '😌',
                  title: 'Calmo e Sob Controle',
                  desc: 'Nível Verde • Fluxo sustentável e mente tranquila',
                  accentColor: 'text-[#006947]',
                  bgIcon: 'bg-[#6ffbbe]/40',
                },
                {
                  id: 'balanced' as CognitiveLoadLevel,
                  emoji: '⚖️',
                  title: 'Equilibrado com esforço habitual',
                  desc: 'Exigência moderada, administrável no dia a dia',
                  accentColor: 'text-[#6b38d4]',
                  bgIcon: 'bg-[#dbe1ff]',
                },
                {
                  id: 'tired' as CognitiveLoadLevel,
                  emoji: '⚠️',
                  title: 'Atenção: Começando a sentir cansaço mental',
                  desc: 'Dificuldade de foco esporádica e corpo pedindo pausa',
                  accentColor: 'text-[#0b1c30]',
                  bgIcon: 'bg-[#dce9ff]',
                },
                {
                  id: 'exhausted' as CognitiveLoadLevel,
                  emoji: '⛔',
                  title: 'Esgotamento: Sobrecarga intensa',
                  desc: 'Alerta de suporte prioritário disponível e acolhimento humano',
                  badge: 'Apoio Imediato',
                  accentColor: 'text-[#ba1a1a]',
                  bgIcon: 'bg-[#ffdad6]',
                },
              ].map((opt) => {
                const isSelected = cognitiveLoad === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setCognitiveLoad(opt.id);
                      sound.playChime('click');
                    }}
                    className={`w-full min-h-[64px] p-4 rounded-2xl transition-all flex items-center justify-between text-left active:scale-[0.99] border ${
                      isSelected
                        ? 'bg-[#e9ddff]/30 border-[#6b38d4]/40 shadow-md ring-1 ring-[#6b38d4]/20'
                        : 'bg-white border-black/[0.04] shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${opt.bgIcon} flex items-center justify-center text-xl shrink-0`}
                      >
                        {opt.emoji}
                      </div>
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-outfit text-sm font-semibold ${
                              isSelected ? opt.accentColor : 'text-[#0b1c30]'
                            }`}
                          >
                            {opt.title}
                          </span>
                          {opt.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-[#ba1a1a] text-white font-outfit text-[10px] font-bold">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <span className="font-outfit text-xs text-[#494454] font-normal leading-snug mt-0.5">
                          {opt.desc}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-[#6b38d4]' : 'bg-[#dce9ff]'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[16px] text-white transition-opacity ${
                          isSelected ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        check
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Slider Card: Humor & Energia Vital */}
            <div className="bg-white p-5 rounded-3xl shadow-sm flex flex-col gap-3 relative overflow-hidden border border-black/[0.03]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#6b38d4] text-[22px] fill-1">
                    bolt
                  </span>
                  <h3 className="font-sora text-base text-[#0b1c30] font-semibold">
                    Humor & Energia Vital
                  </h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-[#e9ddff] text-[#23005c] font-outfit text-xs font-bold flex items-center gap-1 shadow-sm">
                  <span>{energyLevel}</span>/10 • <span className="font-medium">{energyDetails.label}</span>
                </div>
              </div>

              {/* Slider Track with fill */}
              <div className="relative pt-2 pb-1 flex flex-col gap-2">
                <div className="flex justify-between items-center px-1 font-outfit text-xs text-[#494454]">
                  <span className="flex items-center gap-1">😴 Esgotado</span>
                  <span className="flex items-center gap-1 font-semibold text-[#6b38d4]">⚡ Vigoroso</span>
                </div>

                <div className="relative w-full h-8 flex items-center">
                  <div className="absolute inset-x-0 h-3 rounded-full bg-[#dce9ff] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#316bf3] via-[#6b38d4] to-[#4edea3] rounded-full transition-all duration-75"
                      style={{ width: `${sliderPercentage}%` }}
                    />
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={energyLevel}
                    onChange={(e) => {
                      setEnergyLevel(parseInt(e.target.value, 10));
                    }}
                    aria-label="Nível de energia e humor de 1 a 10"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />

                  {/* Visual thumb */}
                  <div
                    className="absolute w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center pointer-events-none transition-transform duration-75 border border-black/[0.06]"
                    style={{ left: `calc(${sliderPercentage}% - 14px)` }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-[#6b38d4]" />
                  </div>
                </div>

                <div className="flex justify-between px-1 text-[11px] text-[#7b7486] font-outfit">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <span
                      key={num}
                      className={energyLevel === num ? 'font-bold text-[#6b38d4]' : ''}
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#eff4ff] p-3 rounded-2xl flex items-center gap-2 border border-[#dce9ff]">
                <span className="material-symbols-outlined text-[20px] text-[#006947] shrink-0">
                  {energyDetails.icon}
                </span>
                <p className="font-outfit text-xs text-[#0b1c30] leading-snug">
                  {energyDetails.feedback}
                </p>
              </div>
            </div>

            {/* Fatores que pesaram hoje */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between">
                <h3 className="font-sora text-base text-[#0b1c30] font-semibold">
                  Fatores que pesaram hoje
                </h3>
                <span className="font-outfit text-xs text-[#494454]">Multi-seleção</span>
              </div>
              <p className="font-outfit text-xs text-[#494454]">
                Selecione os elementos de contexto que mais influenciaram seu bem-estar mental nas últimas horas:
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {defaultFactors.map((factor) => {
                  const isSelected = selectedFactors.includes(factor.label);
                  return (
                    <button
                      key={factor.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleFactor(factor.label)}
                      className={`px-4 py-2.5 rounded-full shadow-sm active:scale-95 transition-all flex items-center gap-1.5 font-outfit text-xs font-semibold ${
                        isSelected
                          ? 'bg-[#6b38d4] text-white shadow-md'
                          : 'bg-white text-[#0b1c30] border border-black/[0.04] hover:bg-[#eff4ff]'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          isSelected ? 'text-white fill-1' : 'text-[#494454]'
                        }`}
                      >
                        {factor.icon}
                      </span>
                      <span>{factor.label}</span>
                    </button>
                  );
                })}

                {/* Additional user custom factors */}
                {selectedFactors
                  .filter((f) => !defaultFactors.some((df) => df.label === f))
                  .map((custom) => (
                    <button
                      key={custom}
                      type="button"
                      aria-pressed="true"
                      onClick={() => toggleFactor(custom)}
                      className="px-4 py-2.5 rounded-full bg-[#6b38d4] text-white shadow-sm active:scale-95 transition-all flex items-center gap-1.5 font-outfit text-xs font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px] text-white fill-1">
                        bookmark
                      </span>
                      <span>{custom}</span>
                    </button>
                  ))}

                {/* Button to add custom factor */}
                {showAddFactor ? (
                  <form onSubmit={handleAddCustomFactor} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={customFactorInput}
                      onChange={(e) => setCustomFactorInput(e.target.value)}
                      placeholder="Outro fator..."
                      autoFocus
                      className="h-10 px-3 rounded-full bg-white border border-[#6b38d4] text-xs font-outfit text-[#0b1c30] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="h-10 px-3 rounded-full bg-[#6b38d4] text-white text-xs font-outfit font-semibold"
                    >
                      Adicionar
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddFactor(true)}
                    className="px-3 py-2.5 rounded-full bg-[#eff4ff] text-[#6b38d4] hover:bg-[#e5eeff] text-xs font-outfit font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Outro fator</span>
                  </button>
                )}
              </div>
            </div>

            {/* Micro-Pausa Somática */}
            <div className="bg-[#eff4ff] rounded-3xl p-4 shadow-sm flex items-center justify-between gap-3 border border-[#dce9ff]">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#6b38d4]/10 flex items-center justify-center shrink-0 text-[#6b38d4] relative">
                  <div className="absolute inset-0 rounded-full border-2 border-[#6b38d4]/30 animate-ping opacity-25" />
                  <span className="material-symbols-outlined text-[28px]">self_improvement</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-outfit text-sm font-bold text-[#0b1c30]">
                    Micro-Pausa Somática
                  </span>
                  <p className="font-outfit text-xs text-[#494454] leading-snug">
                    {somaticCountdown !== null
                      ? `Expirando calmamente: ${somaticCountdown}s restantes...`
                      : 'Antes de prosseguir, expire lentamente por 4 segundos. Solte a tensão nos ombros.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={startSomaticBreath}
                className="px-3.5 py-2 rounded-full bg-white text-[#6b38d4] hover:bg-[#e9ddff] text-xs font-outfit font-bold shrink-0 shadow-xs active:scale-95 transition-all"
              >
                {somaticCountdown !== null ? `${somaticCountdown}s` : 'Respirar'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Action Bar */}
      {!isCompleted && (
        <div className="fixed bottom-0 inset-x-0 bg-[#f8f9ff]/90 backdrop-blur-xl p-4 shadow-[0_-8px_24px_rgba(11,28,48,0.06)] z-40 border-t border-black/[0.04]">
          <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex flex-col gap-2">
            <button
              type="button"
              id="btn-next-step"
              disabled={isSubmitting}
              onClick={handleNextStep}
              className="w-full h-12 min-h-[48px] rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 outline-none focus-visible:ring-4 focus-visible:ring-[#6b38d4]/30 disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    refresh
                  </span>
                  <span>Registrando com Criptografia...</span>
                </>
              ) : (
                <>
                  <span>{currentInfo.nextBtn}</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSaveLater}
              className="w-full h-10 min-h-[40px] rounded-full bg-transparent hover:bg-[#eff4ff] text-[#494454] hover:text-[#0b1c30] font-outfit text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">bookmark_border</span>
              <span>Salvar e continuar depois</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
