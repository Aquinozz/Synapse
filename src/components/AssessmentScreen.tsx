import React, { useEffect, useRef, useState } from 'react';
import { Logo } from './Logo';
import { sound } from '../utils/audio';
import { getWellnessStatus } from '../utils/wellness';
import { useToast } from './Toast';
import { useEmployeePlan } from '../areas/employee/plan';
import { formatDayTime } from '../utils/schedule';

interface AssessmentScreenProps {
  onBack: () => void;
  onFinish: (newScore: number) => void;
  onOpenSOS: () => void;
}

interface StepOption {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  /** Contribution to the wellness index */
  points: number;
  badge?: string;
}

interface Step {
  id: 'focus' | 'safety' | 'load' | 'sleep' | 'selfcare';
  category: string;
  question: string;
  hint: string;
  options: StepOption[];
  /** The last step accepts several answers */
  multi?: boolean;
}

const STEPS: Step[] = [
  {
    id: 'focus',
    category: 'Foco & atenção',
    question: 'Como tem sido sua capacidade de concentração em tarefas contínuas?',
    hint: 'Pense nos últimos dois dias de trabalho.',
    options: [
      { id: 'sharp', emoji: '🎯', title: 'Consigo manter o foco com facilidade', desc: 'Poucas distrações e boa profundidade', points: 4 },
      { id: 'ok', emoji: '🙂', title: 'Me concentro, com algum esforço', desc: 'Às vezes preciso retomar o fio da tarefa', points: 2 },
      { id: 'scattered', emoji: '🌀', title: 'Me distraio com frequência', desc: 'Troco de tarefa muitas vezes sem concluir', points: -3 },
      { id: 'blocked', emoji: '😵‍💫', title: 'Quase não consigo me concentrar', desc: 'A mente está dispersa a maior parte do tempo', points: -6 },
    ],
  },
  {
    id: 'safety',
    category: 'Clima & segurança',
    question: 'Você sente que tem espaço seguro para falar sobre desafios e limites no trabalho?',
    hint: 'Sua resposta nunca é mostrada à sua liderança.',
    options: [
      { id: 'always', emoji: '🤝', title: 'Sim, me sinto à vontade', desc: 'Posso falar abertamente com o time e a liderança', points: 4 },
      { id: 'mostly', emoji: '🙂', title: 'Na maior parte do tempo', desc: 'Há abertura, com alguns assuntos mais difíceis', points: 2 },
      { id: 'rarely', emoji: '😶', title: 'Raramente', desc: 'Costumo guardar o que estou sentindo', points: -3 },
      { id: 'never', emoji: '🚧', title: 'Não me sinto seguro(a)', desc: 'Evito expor qualquer dificuldade', points: -6 },
    ],
  },
  {
    id: 'load',
    category: 'Carga cognitiva',
    question: 'Como você avalia sua sobrecarga de trabalho e ritmo mental nas últimas 48 horas?',
    hint: 'Identificar os primeiros sinais de cansaço é o primeiro passo para recuperar a clareza.',
    options: [
      { id: 'calm', emoji: '😌', title: 'Calmo e sob controle', desc: 'Fluxo sustentável e mente tranquila', points: 15 },
      { id: 'balanced', emoji: '⚖️', title: 'Equilibrado, com esforço habitual', desc: 'Exigência moderada, administrável no dia a dia', points: 10 },
      { id: 'tired', emoji: '⚠️', title: 'Começando a sentir cansaço mental', desc: 'Dificuldade de foco esporádica e corpo pedindo pausa', points: -5 },
      { id: 'exhausted', emoji: '⛔', title: 'Esgotamento: sobrecarga intensa', desc: 'Sinto que cheguei ao meu limite', points: -20, badge: 'Apoio imediato' },
    ],
  },
  {
    id: 'sleep',
    category: 'Sono & recuperação',
    question: 'Como foi a qualidade do seu descanso e da desconexão mental na última noite?',
    hint: 'Considere tanto as horas dormidas quanto como você acordou.',
    options: [
      { id: 'great', emoji: '🌙', title: 'Dormi bem e acordei descansado(a)', desc: 'Consegui me desligar do trabalho', points: 4 },
      { id: 'fine', emoji: '🙂', title: 'Razoável', desc: 'Dormi o suficiente, mas poderia ser melhor', points: 2 },
      { id: 'light', emoji: '😪', title: 'Sono leve ou interrompido', desc: 'Acordei algumas vezes pensando em pendências', points: -3 },
      { id: 'bad', emoji: '🥱', title: 'Quase não descansei', desc: 'Dificuldade para dormir ou desligar a mente', points: -6 },
    ],
  },
  {
    id: 'selfcare',
    category: 'Autocuidado',
    question: 'O que mais ajudaria a sua rotina nesta semana?',
    hint: 'Escolha quantas opções quiser. Usamos isso para personalizar suas sugestões.',
    multi: true,
    options: [
      { id: 'breathing', emoji: '🌬️', title: 'Pausas de respiração guiada', desc: 'Lembretes curtos ao longo do dia', points: 0 },
      { id: 'therapy', emoji: '💬', title: 'Conversar com um terapeuta', desc: 'Sessão individual coberta pelo plano', points: 0 },
      { id: 'sleep', emoji: '🛌', title: 'Melhorar o sono', desc: 'Rotina noturna e sons para relaxar', points: 0 },
      { id: 'boundaries', emoji: '🧭', title: 'Organizar limites e prioridades', desc: 'Menos reuniões, mais tempo de foco', points: 0 },
    ],
  },
];

const DEFAULT_FACTORS = [
  { id: 'deadlines', label: 'Prazos curtos', icon: 'timer' },
  { id: 'meetings', label: 'Muitas reuniões', icon: 'groups' },
  { id: 'sleep_off', label: 'Dificuldade para desligar à noite', icon: 'bedtime_off' },
  { id: 'collaboration', label: 'Boa colaboração no time', icon: 'favorite' },
  { id: 'feedback', label: 'Feedback positivo recebido', icon: 'thumb_up' },
];

const getEnergyDetails = (val: number) => {
  if (val <= 2) {
    return { label: 'Esgotamento total', feedback: 'Seu corpo está pedindo descanso. Vá com calma hoje e considere pedir apoio.', icon: 'error' };
  }
  if (val <= 4) {
    return { label: 'Baixa reserva', feedback: 'Ritmo mental sob tensão. Programar micro-pausas é essencial hoje.', icon: 'warning' };
  }
  if (val <= 6) {
    return { label: 'Estável', feedback: 'Fluxo moderado e sustentável. Boa oportunidade para manter bons limites.', icon: 'info' };
  }
  if (val <= 8) {
    return { label: 'Energia positiva', feedback: 'Boa reserva de energia. Aproveite para avançar no que exige mais foco.', icon: 'check_circle' };
  }
  return { label: 'Pleno vigor', feedback: 'Alta disposição e clareza. Aproveite o foco criativo.', icon: 'verified' };
};

interface Draft {
  stepIndex: number;
  answers: Record<string, string[]>;
  energyLevel: number;
  selectedFactors: string[];
}

const DRAFT_KEY = 'synapse:checkin-draft';

const loadDraft = (): Draft | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
};

const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Storage unavailable (private mode): nothing to clear
  }
};

export const AssessmentScreen: React.FC<AssessmentScreenProps> = ({ onBack, onFinish, onOpenSOS }) => {
  const showToast = useToast();
  const { therapist, next, now } = useEmployeePlan();
  const [draft] = useState(loadDraft);
  const [stepIndex, setStepIndex] = useState(draft?.stepIndex ?? 0);
  const [answers, setAnswers] = useState<Record<string, string[]>>(draft?.answers ?? {});
  const [energyLevel, setEnergyLevel] = useState<number>(draft?.energyLevel ?? 6);
  const [selectedFactors, setSelectedFactors] = useState<string[]>(draft?.selectedFactors ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [customFactorInput, setCustomFactorInput] = useState('');
  const [showAddFactor, setShowAddFactor] = useState(false);
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (submitTimer.current) clearTimeout(submitTimer.current);
    };
  }, []);

  const step = STEPS[stepIndex];
  const stepAnswers = answers[step.id] ?? [];
  const isLastStep = stepIndex === STEPS.length - 1;
  const canContinue = stepAnswers.length > 0;
  const progressPercent = Math.round(((stepIndex + (canContinue ? 1 : 0)) / STEPS.length) * 100);

  const energyDetails = getEnergyDetails(energyLevel);
  const sliderPercentage = ((energyLevel - 1) / 9) * 100;
  const feelsExhausted = answers.load?.[0] === 'exhausted';

  const selectOption = (optionId: string) => {
    sound.playChime('click');
    setAnswers((current) => {
      const selected = current[step.id] ?? [];
      if (!step.multi) return { ...current, [step.id]: [optionId] };
      return {
        ...current,
        [step.id]: selected.includes(optionId)
          ? selected.filter((id) => id !== optionId)
          : [...selected, optionId],
      };
    });
  };

  const toggleFactor = (label: string) => {
    sound.playChime('click');
    setSelectedFactors((current) =>
      current.includes(label) ? current.filter((f) => f !== label) : [...current, label]
    );
  };

  const handleAddCustomFactor = (e: React.FormEvent) => {
    e.preventDefault();
    const label = customFactorInput.trim();
    if (!label) return;
    if (!selectedFactors.includes(label)) setSelectedFactors([...selectedFactors, label]);
    setCustomFactorInput('');
    setShowAddFactor(false);
    sound.playChime('click');
  };

  const handleNextStep = () => {
    sound.playChime('click');
    if (!isLastStep) {
      setStepIndex(stepIndex + 1);
      window.scrollTo({ top: 0 });
      return;
    }

    setIsSubmitting(true);
    submitTimer.current = setTimeout(() => {
      setIsSubmitting(false);
      setIsCompleted(true);
      clearDraft();
      sound.playChime('success');
      window.scrollTo({ top: 0 });
    }, 700);
  };

  const handleBack = () => {
    if (stepIndex > 0 && !isCompleted) {
      setStepIndex(stepIndex - 1);
      window.scrollTo({ top: 0 });
    } else {
      onBack();
    }
  };

  const handleSaveLater = () => {
    sound.playChime('click');
    try {
      const toSave: Draft = { stepIndex, answers, energyLevel, selectedFactors };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(toSave));
      showToast('Progresso salvo neste dispositivo. Continue quando quiser.');
    } catch {
      showToast('Não foi possível salvar o progresso neste navegador.', 'info');
    }
    onBack();
  };

  const calculateFinalScore = () => {
    let score = 70;
    STEPS.forEach((s) => {
      const option = s.options.find((o) => o.id === answers[s.id]?.[0]);
      if (option && !s.multi) score += option.points;
    });
    score += Math.round((energyLevel - 5) * 2.5);
    return Math.min(98, Math.max(45, score));
  };

  const finalScore = calculateFinalScore();
  const finalStatus = getWellnessStatus(finalScore);
  const wantsTherapy = answers.selfcare?.includes('therapy');

  return (
    <div className="flex-1 flex flex-col relative w-full min-h-screen bg-[#f8f9ff]">
      {/* Top Header */}
      <header className="fixed top-0 inset-x-0 z-30 bg-[#f8f9ff]/85 backdrop-blur-xl border-b border-black/[0.04] pt-[env(safe-area-inset-top,0px)]">
        <div className="h-16 max-w-2xl mx-auto px-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={handleBack}
              aria-label={stepIndex > 0 && !isCompleted ? 'Voltar para a etapa anterior' : 'Sair do check-in'}
              className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-[#0b1c30] hover:bg-[#eff4ff] active:bg-[#dce9ff] transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <Logo size={28} className="hidden xs:block" />
            <h1 className="font-sora text-base sm:text-lg text-[#0b1c30] font-bold tracking-tight truncate">
              Check-in diário
            </h1>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dbe1ff]/60 shrink-0">
            <span className="material-symbols-outlined text-[14px] text-[#003ea8]">lock</span>
            <span className="font-outfit text-[11px] leading-none text-[#003ea8] font-semibold">
              100% anônimo
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col w-full max-w-2xl mx-auto pt-20 px-4 ${isCompleted ? 'pb-10' : 'pb-40'}`}>
        {isCompleted ? (
          <div className="card !p-6 sm:!p-8 flex flex-col items-center text-center my-auto animate-pop-in">
            <div className="w-16 h-16 rounded-full bg-[#f5fff6] text-[#00855b] flex items-center justify-center shadow-inner mb-3">
              <span className="material-symbols-outlined text-[36px] fill-1">verified</span>
            </div>

            <span className="font-outfit text-xs font-bold uppercase tracking-wider text-[#00855b]">
              Check-in concluído
            </span>
            <h2 className="font-sora text-2xl font-bold text-[#0b1c30] mt-1">
              Obrigado por cuidar de você
            </h2>

            <div className="my-5 p-4 rounded-2xl bg-[#eff4ff] w-full text-left flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="flex flex-col">
                  <span className="font-outfit text-sm text-[#494454] font-medium">Seu índice de bem-estar hoje</span>
                  <span className={`font-outfit text-sm font-semibold ${finalStatus.text}`}>{finalStatus.label}</span>
                </span>
                <span className="font-sora text-2xl font-bold text-[#6b38d4] tabular-nums shrink-0">
                  {finalScore}
                  <span className="font-outfit text-sm font-medium text-[#494454]">/100</span>
                </span>
              </div>
              <p className="font-outfit text-sm text-[#0b1c30] leading-relaxed">
                Suas respostas entram de forma 100% anônima no índice geral da empresa. Ninguém vê o que você respondeu individualmente.
              </p>
            </div>

            <div className="w-full flex flex-col gap-2 mb-5 text-left">
              <span className="font-sora text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                Sugestões para hoje
              </span>
              {(feelsExhausted || finalScore < 60) && (
                <button
                  onClick={onOpenSOS}
                  className="p-3 bg-[#ffdad6]/50 hover:bg-[#ffdad6] rounded-xl border border-[#ffdad6] text-sm text-[#93000a] flex items-center gap-2 text-left transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px] fill-1 shrink-0">shield_with_heart</span>
                  <span className="flex-1">Você não precisa passar por isso sozinho(a). Fale agora com um plantonista, em sigilo.</span>
                  <span className="material-symbols-outlined text-[18px] shrink-0">arrow_forward</span>
                </button>
              )}
              <div className="p-3 bg-[#f8f9ff] rounded-xl border border-[#e5eeff] text-sm text-[#494454] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00855b] text-[20px] shrink-0">spa</span>
                <span>Faça uma pausa de respiração 4-7-8 antes das 18h.</span>
              </div>
              <div className="p-3 bg-[#f8f9ff] rounded-xl border border-[#e5eeff] text-sm text-[#494454] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6b38d4] text-[20px] shrink-0">event_available</span>
                <span>
                  {therapist && next
                    ? `Sua próxima sessão com ${therapist.name}: ${formatDayTime(next, now).toLowerCase()}.${
                        wantsTherapy ? ' Leve para a conversa o que você respondeu aqui.' : ''
                      }`
                    : 'Seu plano cobre 1 sessão por semana. Escolha um psicólogo na aba Terapeutas.'}
                </span>
              </div>
            </div>

            <button
              onClick={() => onFinish(finalScore)}
              className="w-full h-12 min-h-12 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-bold transition-all active:scale-[0.98]"
            >
              Voltar ao início
            </button>
          </div>
        ) : (
          <div key={step.id} className="flex flex-col w-full gap-5 animate-screen-in">
            {/* Step Progress Bar */}
            <div className="pt-2 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-outfit text-sm text-[#6b38d4] font-semibold">
                  Etapa {stepIndex + 1} de {STEPS.length}
                </span>
                <span className="font-outfit text-xs text-[#494454]">Cerca de 2 minutos no total</span>
              </div>

              <div
                className="w-full h-2 bg-[#dce9ff] rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progresso do check-in"
              >
                <div
                  className="h-full bg-gradient-to-r from-[#316bf3] to-[#6b38d4] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Question Title */}
            <div className="flex flex-col gap-1.5">
              <span className="font-outfit text-xs text-[#6b38d4] uppercase font-bold tracking-wider">
                {step.category}
              </span>
              <h2
                id="step-question"
                className="font-sora text-xl sm:text-2xl text-[#0b1c30] font-semibold tracking-tight leading-snug"
              >
                {step.question}
              </h2>
              <p className="font-outfit text-sm text-[#494454]">{step.hint}</p>
            </div>

            {/* Options */}
            <div
              className="flex flex-col gap-2.5"
              role={step.multi ? 'group' : 'radiogroup'}
              aria-labelledby="step-question"
            >
              {step.options.map((opt) => {
                const isSelected = stepAnswers.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role={step.multi ? 'checkbox' : 'radio'}
                    aria-checked={isSelected}
                    onClick={() => selectOption(opt.id)}
                    className={`w-full min-h-16 p-4 rounded-2xl transition-all flex items-center justify-between gap-3 text-left active:scale-[0.99] border ${
                      isSelected
                        ? 'bg-[#e9ddff]/40 border-[#6b38d4]/50 ring-1 ring-[#6b38d4]/20'
                        : 'bg-white border-[#e5eeff] hover:border-[#6b38d4]/30'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-10 h-10 rounded-full bg-[#eff4ff] flex items-center justify-center text-xl shrink-0"
                        aria-hidden="true"
                      >
                        {opt.emoji}
                      </span>
                      <span className="flex flex-col min-w-0">
                        <span className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-outfit text-sm sm:text-base font-semibold text-[#0b1c30]">
                            {opt.title}
                          </span>
                          {opt.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-[#ba1a1a] text-white font-outfit text-[10px] font-bold">
                              {opt.badge}
                            </span>
                          )}
                        </span>
                        <span className="font-outfit text-sm text-[#494454] leading-snug mt-0.5">
                          {opt.desc}
                        </span>
                      </span>
                    </span>

                    <span
                      className={`w-6 h-6 flex items-center justify-center shrink-0 transition-colors ${
                        step.multi ? 'rounded-md' : 'rounded-full'
                      } ${isSelected ? 'bg-[#6b38d4]' : 'bg-white border-2 border-[#cbc3d7]'}`}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-[16px] text-white">check</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Immediate support when the person reports exhaustion */}
            {step.id === 'load' && feelsExhausted && (
              <div className="p-4 rounded-2xl bg-[#ffdad6]/50 border border-[#ffdad6] flex items-center justify-between gap-3 flex-wrap animate-fade-in">
                <p className="font-outfit text-sm text-[#93000a] leading-snug flex-1 basis-48">
                  <strong>Sentimos muito que esteja assim.</strong> Um plantonista pode conversar com você agora, em total sigilo.
                </p>
                <button
                  type="button"
                  onClick={onOpenSOS}
                  className="h-10 px-4 rounded-full bg-[#ba1a1a] hover:bg-[#93000a] text-white font-outfit text-sm font-bold shrink-0 transition-colors"
                >
                  Abrir SOS
                </button>
              </div>
            )}

            {step.id === 'load' && (
              <>
                {/* Slider Card: Energia */}
                <div className="card flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#6b38d4] text-[22px] fill-1">bolt</span>
                      <h3 id="energy-label" className="font-sora text-base text-[#0b1c30] font-semibold">
                        Nível de energia
                      </h3>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-[#e9ddff] text-[#23005c] font-outfit text-xs font-bold tabular-nums">
                      {energyLevel}/10 · <span className="font-medium">{energyDetails.label}</span>
                    </div>
                  </div>

                  <div className="relative pt-1 flex flex-col gap-2">
                    <div className="relative w-full h-8 flex items-center">
                      <div className="absolute inset-x-0 h-3 rounded-full bg-[#dce9ff] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#316bf3] via-[#6b38d4] to-[#4edea3] rounded-full"
                          style={{ width: `calc(14px + (100% - 28px) * ${sliderPercentage / 100})` }}
                        />
                      </div>

                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={energyLevel}
                        onChange={(e) => setEnergyLevel(parseInt(e.target.value, 10))}
                        aria-labelledby="energy-label"
                        aria-valuetext={`${energyLevel} de 10, ${energyDetails.label}`}
                        className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />

                      {/* Visual thumb */}
                      <div
                        className="absolute w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center pointer-events-none border border-black/[0.06] peer-focus-visible:ring-4 peer-focus-visible:ring-[#6b38d4]/30"
                        style={{ left: `calc((100% - 28px) * ${sliderPercentage / 100})` }}
                      >
                        <div className="w-3.5 h-3.5 rounded-full bg-[#6b38d4]" />
                      </div>
                    </div>

                    <div className="flex justify-between font-outfit text-xs text-[#494454]">
                      <span>😴 Sem energia</span>
                      <span>⚡ Muita energia</span>
                    </div>
                  </div>

                  <div className="bg-[#eff4ff] p-3 rounded-2xl flex items-center gap-2 border border-[#dce9ff]">
                    <span className="material-symbols-outlined text-[20px] text-[#6b38d4] shrink-0">
                      {energyDetails.icon}
                    </span>
                    <p className="font-outfit text-sm text-[#0b1c30] leading-snug">{energyDetails.feedback}</p>
                  </div>
                </div>

                {/* Fatores que pesaram hoje */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-sora text-base text-[#0b1c30] font-semibold">
                    O que mais influenciou seu dia?
                    <span className="font-outfit text-xs font-normal text-[#7b7486]"> · opcional</span>
                  </h3>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {DEFAULT_FACTORS.map((factor) => {
                      const isSelected = selectedFactors.includes(factor.label);
                      return (
                        <button
                          key={factor.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => toggleFactor(factor.label)}
                          className={`h-11 px-4 rounded-full active:scale-95 transition-all flex items-center gap-1.5 font-outfit text-sm font-semibold border ${
                            isSelected
                              ? 'bg-[#6b38d4] text-white border-[#6b38d4]'
                              : 'bg-white text-[#0b1c30] border-[#e5eeff] hover:border-[#6b38d4]/30'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[18px] ${
                              isSelected ? 'fill-1' : 'text-[#494454]'
                            }`}
                          >
                            {factor.icon}
                          </span>
                          <span>{factor.label}</span>
                        </button>
                      );
                    })}

                    {/* Custom factors added by the user */}
                    {selectedFactors
                      .filter((f) => !DEFAULT_FACTORS.some((df) => df.label === f))
                      .map((custom) => (
                        <button
                          key={custom}
                          type="button"
                          aria-label={`Remover fator ${custom}`}
                          onClick={() => toggleFactor(custom)}
                          className="h-11 px-4 rounded-full bg-[#6b38d4] text-white active:scale-95 transition-all flex items-center gap-1.5 font-outfit text-sm font-semibold"
                        >
                          <span>{custom}</span>
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      ))}

                    {showAddFactor ? (
                      <form onSubmit={handleAddCustomFactor} className="flex items-center gap-1.5 w-full xs:w-auto">
                        <input
                          type="text"
                          value={customFactorInput}
                          onChange={(e) => setCustomFactorInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setShowAddFactor(false);
                          }}
                          aria-label="Outro fator"
                          placeholder="Outro fator..."
                          maxLength={40}
                          autoFocus
                          className="h-11 px-4 flex-1 min-w-0 rounded-full bg-white border border-[#6b38d4] text-sm font-outfit text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]/30"
                        />
                        <button
                          type="submit"
                          disabled={!customFactorInput.trim()}
                          className="h-11 px-4 rounded-full bg-[#6b38d4] text-white text-sm font-outfit font-semibold disabled:opacity-50"
                        >
                          Adicionar
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddFactor(true)}
                        className="h-11 px-4 rounded-full bg-[#eff4ff] text-[#5516be] hover:bg-[#e5eeff] text-sm font-outfit font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        <span>Outro fator</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Privacy note */}
            <div className="bg-[#eff4ff] rounded-2xl p-4 flex items-start gap-3 border border-[#dce9ff]">
              <span className="material-symbols-outlined text-[20px] text-[#0051d5] fill-1 shrink-0">
                enhanced_encryption
              </span>
              <p className="font-outfit text-sm text-[#494454] leading-snug">
                Suas respostas individuais <strong>nunca são compartilhadas com o RH ou com gestores</strong>. Elas compõem apenas índices gerais e anônimos.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Action Bar */}
      {!isCompleted && (
        <div className="fixed bottom-0 inset-x-0 bg-[#f8f9ff]/90 backdrop-blur-xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(11,28,48,0.06)] z-30 border-t border-black/[0.04]">
          <div className="max-w-2xl mx-auto flex flex-col gap-1">
            <button
              type="button"
              disabled={isSubmitting || !canContinue}
              onClick={handleNextStep}
              className="w-full h-12 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-[#cbc3d7] disabled:text-white disabled:active:scale-100"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                  <span>Registrando com criptografia...</span>
                </>
              ) : (
                <>
                  <span>
                    {!canContinue
                      ? 'Escolha uma opção para continuar'
                      : isLastStep
                      ? 'Concluir check-in'
                      : 'Continuar'}
                  </span>
                  {canContinue && (
                    <span className="material-symbols-outlined text-[20px]">
                      {isLastStep ? 'check' : 'arrow_forward'}
                    </span>
                  )}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSaveLater}
              className="w-full h-10 rounded-full hover:bg-[#eff4ff] text-[#494454] hover:text-[#0b1c30] font-outfit text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">bookmark</span>
              <span>Salvar e continuar depois</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
