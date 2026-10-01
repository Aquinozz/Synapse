import React from 'react';
import { getWellnessStatus } from '../utils/wellness';
import { useEmployeePlan } from '../areas/employee/plan';
import { formatDayTime, isSameDay } from '../utils/schedule';

interface SynapseAIScreenProps {
  currentWellnessScore: number;
  hasCheckedInToday: boolean;
  onStartAssessment: () => void;
  onOpenBreathing: (technique?: '478' | 'box') => void;
  onFindTherapist: () => void;
  onOpenWellness: () => void;
}

interface Recommendation {
  id: string;
  icon: string;
  title: string;
  reason: string;
  cta: string;
  action: () => void;
}

const WEEK_PATTERNS = [
  {
    icon: 'trending_up',
    tone: 'bg-[#6ffbbe]/25 text-[#005236]',
    title: 'Seu índice subiu 12% nesta semana',
    detail: 'A melhora acompanha os dias em que você fez pausas de respiração.',
  },
  {
    icon: 'groups',
    tone: 'bg-[#ffe9c7]/70 text-[#7a4100]',
    title: 'Reuniões em excesso pesam no seu dia',
    detail: 'Foi o fator que você mais marcou nos check-ins recentes.',
  },
  {
    icon: 'local_fire_department',
    tone: 'bg-[#e9ddff]/60 text-[#5516be]',
    title: '6 de 7 dias ativos',
    detail: 'Manter a constância é o que mais protege contra o esgotamento.',
  },
];

export const SynapseAIScreen: React.FC<SynapseAIScreenProps> = ({
  currentWellnessScore,
  hasCheckedInToday,
  onStartAssessment,
  onOpenBreathing,
  onFindTherapist,
  onOpenWellness,
}) => {
  const { next, now, therapist } = useEmployeePlan();
  const sessionIsToday = next !== null && isSameDay(next, now);
  const status = getWellnessStatus(currentWellnessScore);
  const needsSupport = currentWellnessScore < 60;

  const recommendations: Recommendation[] = [
    ...(needsSupport
      ? [
          {
            id: 'therapist',
            icon: 'clinical_notes',
            title: therapist ? `Leve isso para a sessão com ${therapist.name}` : 'Escolha um psicólogo',
            reason:
              therapist && next
                ? `Seu índice está abaixo do habitual. Sua próxima sessão é ${formatDayTime(next, now).toLowerCase()}; se precisar antes, dá para remarcar.`
                : 'Seu índice está abaixo do habitual. Seu plano cobre uma sessão por semana com um profissional.',
            cta: therapist ? 'Ver minha sessão' : 'Ver psicólogos',
            action: onFindTherapist,
          },
        ]
      : []),
    ...(!hasCheckedInToday
      ? [
          {
            id: 'checkin',
            icon: 'fact_check',
            title: 'Faça o check-in de hoje',
            reason: 'Com as respostas de hoje, as sugestões ficam mais precisas para o seu momento.',
            cta: 'Começar check-in',
            action: onStartAssessment,
          },
        ]
      : []),
    {
      id: 'breathing',
      icon: 'air',
      title: sessionIsToday ? 'Respiração 4-7-8 antes da sessão de hoje' : 'Respiração 4-7-8 para desacelerar',
      reason: sessionIsToday
        ? 'Ajuda a desacelerar o ritmo cardíaco e chegar mais presente na conversa.'
        : 'Três minutos bastam para reduzir a tensão acumulada no dia.',
      cta: 'Iniciar agora',
      action: () => onOpenBreathing('478'),
    },
    {
      id: 'pauses',
      icon: 'spa',
      title: 'Programe pausas curtas entre reuniões',
      reason: 'Descanso visual e alongamento de 30 segundos reduzem a fadiga acumulada.',
      cta: 'Ver práticas',
      action: onOpenWellness,
    },
  ];

  return (
    <div className="screen">
      <section className="flex flex-col">
        <h1 className="font-sora text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight">
          Sugestões para você
        </h1>
        <p className="font-outfit text-sm lg:text-base text-[#494454]">
          A Synapse AI lê seus check-ins e indica o próximo passo de cuidado.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6">
          {/* Leitura do momento */}
          <section className="rounded-3xl p-5 lg:p-6 bg-gradient-to-br from-[#6b38d4] to-[#0051d5] text-white relative overflow-hidden">
            <div className="absolute -right-12 -bottom-16 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <span className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[30px]">neurology</span>
              </span>
              <div className="min-w-0">
                <span className="font-outfit text-xs font-semibold uppercase tracking-wider text-[#dbe1ff]">
                  Seu momento
                </span>
                <p className="font-sora text-lg lg:text-xl font-bold tracking-tight leading-snug">
                  Índice {currentWellnessScore}/100 · {status.label}
                </p>
                <p className="font-outfit text-sm text-white/85 leading-snug mt-0.5">
                  {needsSupport
                    ? 'Seus sinais pedem atenção. Vá com calma e conte com apoio profissional.'
                    : hasCheckedInToday
                    ? 'Check-in de hoje registrado. Estas são as sugestões para o restante do dia.'
                    : 'Você vem em uma boa sequência. Veja como manter o ritmo hoje.'}
                </p>
              </div>
            </div>
          </section>

          {/* Recomendações */}
          <section className="flex flex-col gap-3">
            <h2 className="font-sora text-base lg:text-lg font-bold text-[#0b1c30]">Próximos passos</h2>
            <ul className="flex flex-col gap-3">
              {recommendations.map((rec, idx) => (
                <li key={rec.id} className="card !p-4 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <span
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                      idx === 0 ? 'bg-[#6b38d4] text-white' : 'bg-[#eff4ff] text-[#6b38d4]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">{rec.icon}</span>
                  </span>
                  <div className="flex flex-col min-w-0 flex-1 basis-48">
                    <span className="font-sora text-sm font-bold text-[#0b1c30]">{rec.title}</span>
                    <span className="font-outfit text-sm text-[#494454] leading-snug">{rec.reason}</span>
                  </div>
                  <button
                    onClick={rec.action}
                    className={`w-full sm:w-auto h-11 px-5 rounded-full font-outfit text-sm font-semibold shrink-0 active:scale-95 transition-all ${
                      idx === 0
                        ? 'bg-[#6b38d4] hover:bg-[#8455ef] text-white'
                        : 'bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be]'
                    }`}
                  >
                    {rec.cta}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-4 lg:gap-6">
          {/* Padrões da semana */}
          <section className="card flex flex-col gap-3">
            <h2 className="font-sora text-base font-bold text-[#0b1c30]">O que notamos na sua semana</h2>
            <ul className="flex flex-col gap-3">
              {WEEK_PATTERNS.map((pattern) => (
                <li key={pattern.title} className="flex items-start gap-3">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pattern.tone}`}>
                    <span className="material-symbols-outlined text-[20px]">{pattern.icon}</span>
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-outfit text-sm font-semibold text-[#0b1c30]">{pattern.title}</span>
                    <span className="font-outfit text-sm text-[#494454] leading-snug">{pattern.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Transparência */}
          <section className="rounded-3xl p-4 bg-[#eff4ff] border border-[#dce9ff] flex items-start gap-3">
            <span className="material-symbols-outlined text-[20px] text-[#0051d5] fill-1 shrink-0">verified_user</span>
            <p className="font-outfit text-sm text-[#494454] leading-snug">
              <strong className="text-[#003ea8] font-semibold">Como isso funciona:</strong> as sugestões usam apenas os seus check-ins e ficam visíveis só para você. Elas não substituem a orientação de um profissional.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
