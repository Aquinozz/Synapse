import React, { useState } from 'react';
import { Link } from 'react-router';
import { HOME_BY_ROLE, useSession } from '../auth/session';
import { PRICING, formatBRL } from '../config/pricing';
import { IMAGES } from '../constants/images';
import { AccessibilityButton } from '../components/AccessibilityButton';
import { Logo } from '../components/Logo';
import { TermsModal } from '../components/TermsModal';
import { Modal, ModalCloseButton } from '../components/Modal';
import { useToast } from '../components/Toast';

const STEPS = [
  {
    icon: 'domain',
    title: 'A empresa contrata',
    text: `Um valor fixo de ${formatBRL(PRICING.companyPerEmployee)} por funcionário ao mês, sem coparticipação para quem usa.`,
  },
  {
    icon: 'person_search',
    title: 'Cada pessoa escolhe seu psicólogo',
    text: 'O funcionário entra no app, conhece os profissionais e define um horário fixo na semana que funcione para ele.',
  },
  {
    icon: 'event_repeat',
    title: 'Sessão toda semana',
    text: `Uma sessão de ${PRICING.sessionMinutes} minutos por semana, por vídeo ou áudio, sempre com o mesmo profissional. Dá para remarcar ou trocar quando precisar.`,
  },
];

const COMPANY_BENEFITS = [
  '1 sessão por semana para cada funcionário',
  'Psicólogos com CRP verificado',
  'Check-in diário e práticas guiadas no app',
  'Canal de acolhimento 24 horas',
  'Indicadores de bem-estar sempre agregados e anônimos',
];

const PSYCHOLOGIST_BENEFITS = [
  'Pacientes das empresas chegam até você pelo app',
  'Agenda semanal com horários recorrentes',
  'Sala de vídeo criptografada incluída',
  `Repasse de ${formatBRL(PRICING.sessionPayout)} por sessão realizada`,
];

const PSYCHOLOGIST_STEPS = [
  'Crie sua conta com o seu CRP.',
  'Conferimos o seu registro e liberamos o seu perfil.',
  'Abra os horários que quer atender e receba os pacientes.',
];

const PRIVACY_POINTS = [
  {
    icon: 'visibility_off',
    title: 'A empresa não sabe quem consulta',
    text: 'Ela paga pelo plano, mas nunca vê quem agendou, com quem ou quando.',
  },
  {
    icon: 'lock',
    title: 'Sessões criptografadas',
    text: 'Vídeo e áudio de ponta a ponta, com prontuário sob sigilo profissional do CFP.',
  },
  {
    icon: 'bar_chart',
    title: 'Só dados agregados',
    text: 'Os indicadores para o RH exigem no mínimo 5 respostas por equipe. Ninguém é identificado.',
  },
];

const FAQ = [
  {
    q: 'A empresa fica sabendo o que eu falo na terapia?',
    a: 'Não. O conteúdo das sessões é protegido por sigilo profissional. A empresa também não sabe se você agendou, com quem ou em que horário.',
  },
  {
    q: 'E se eu não me adaptar ao psicólogo?',
    a: 'Você pode trocar de profissional a qualquer momento pelo app e escolher um novo horário fixo.',
  },
  {
    q: 'Posso remarcar a sessão da semana?',
    a: 'Sim. Você escolhe outro horário livre do seu psicólogo na mesma semana; o horário fixo continua valendo nas seguintes.',
  },
  {
    q: 'Sou psicólogo. Como funciona para mim?',
    a: 'Você cria a conta com o seu CRP, abre os horários que quiser atender e recebe um repasse por cada sessão realizada.',
  },
];

const MIN_EMPLOYEES = 5;
const MAX_EMPLOYEES = 500;

export const LandingPage: React.FC = () => {
  const { session } = useSession();
  const [employees, setEmployees] = useState(50);
  const [isLeadOpen, setIsLeadOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const monthlyTotal = employees * PRICING.companyPerEmployee;

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] font-outfit overflow-x-clip">
      {/* Topo */}
      <header className="sticky top-0 z-30 bg-[#f8f9ff]/85 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-6xl mx-auto h-16 px-4 lg:px-8 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 rounded-lg">
            <Logo variant="horizontal" size={40} />
          </Link>

          <nav aria-label="Seções" className="hidden md:flex items-center gap-1 text-sm font-medium text-[#494454]">
            {[
              ['#como-funciona', 'Como funciona'],
              ['#empresas', 'Para empresas'],
              ['#psicologos', 'Para psicólogos'],
              ['#duvidas', 'Dúvidas'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="px-3 py-2 rounded-full hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1 shrink-0">
            <AccessibilityButton />
            <Link
              to={session ? HOME_BY_ROLE[session.role] : '/entrar'}
              className="h-10 px-5 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white text-sm font-semibold flex items-center transition-colors shrink-0"
            >
              {session ? 'Abrir o app' : 'Entrar'}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 lg:px-8 pt-10 lg:pt-20 pb-12 lg:pb-20 grid lg:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-5">
            <span className="self-start px-3 py-1 rounded-full bg-[#e9ddff]/70 text-[#5516be] text-xs font-semibold">
              Plano de saúde mental para empresas
            </span>
            <h1 className="font-sora text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Terapia <span className="text-[#6b38d4]">toda semana</span> para o seu time.
            </h1>
            <p className="text-base lg:text-lg text-[#494454] leading-relaxed max-w-xl">
              A empresa paga {formatBRL(PRICING.companyPerEmployee)} por funcionário ao mês. Cada pessoa tem uma sessão semanal com um psicólogo fixo, em total sigilo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsLeadOpen(true)}
                className="h-13 px-7 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                Quero para minha empresa
                <span className="material-symbols-outlined text-[1.375rem]">arrow_forward</span>
              </button>
              <a
                href="#psicologos"
                className="h-13 px-7 rounded-full bg-white border border-[#e5eeff] hover:border-[#6b38d4]/30 text-[#0b1c30] font-semibold flex items-center justify-center transition-colors"
              >
                Sou psicólogo
              </a>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#494454]">
              {['CRP verificado', 'Conforme a LGPD', 'Vídeo criptografado'].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[1.25rem] text-[#006947]">check_circle</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Prévia do produto */}
          <div className="relative" aria-hidden="true">
            <div className="absolute -inset-6 bg-gradient-to-br from-[#e9ddff] to-[#dbe1ff] rounded-[2.5rem] blur-2xl opacity-70" />
            <div className="relative card !p-5 lg:!p-6 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-sora text-base font-bold">Sua sessão da semana</span>
                <span className="px-2.5 py-1 rounded-full bg-[#6ffbbe]/30 text-[#005236] text-2xs font-semibold">
                  Confirmada
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl border border-[#e5eeff]">
                <img src={IMAGES.camila} alt="" className="w-12 h-12 rounded-full object-cover" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold">Dra. Camila Rossi</span>
                  <span className="text-xs text-[#494454]">Toda quarta, 16:30 · vídeo</span>
                </div>
                <span className="h-9 px-4 rounded-full bg-[#6b38d4] text-white text-sm font-semibold flex items-center">
                  Entrar
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['Bem-estar', '84', 'bg-[#e9ddff]/50'],
                  ['Sessão', 'Marcada', 'bg-[#6ffbbe]/25'],
                  ['Dias ativos', '6 de 7', 'bg-[#ffe9c7]/70'],
                ].map(([label, value, tone]) => (
                  <div key={label} className={`rounded-2xl p-3 ${tone}`}>
                    <div className="text-2xs text-[#494454] font-medium">{label}</div>
                    <div className="font-sora text-base font-bold">{value}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#eff4ff] text-xs text-[#494454]">
                <span className="material-symbols-outlined text-[1.25rem] text-[#0051d5] fill-1">verified_user</span>
                100% anônimo para a empresa
              </div>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="scroll-mt-20 bg-white border-y border-[#e5eeff]">
          <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12 lg:py-20 flex flex-col gap-8">
            <div className="max-w-2xl">
              <h2 className="font-sora text-2xl lg:text-4xl font-bold tracking-tight">Como funciona</h2>
              <p className="text-base text-[#494454] mt-2">
                Simples para o RH, acolhedor para quem usa.
              </p>
            </div>
            <ol className="grid md:grid-cols-3 gap-4 lg:gap-6">
              {STEPS.map((step, idx) => (
                <li key={step.title} className="rounded-3xl p-6 bg-[#f8f9ff] border border-[#e5eeff] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="w-12 h-12 rounded-2xl bg-[#e9ddff] text-[#6b38d4] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[1.8125rem]">{step.icon}</span>
                    </span>
                    <span className="font-sora text-3xl font-bold text-[#dce9ff]">{idx + 1}</span>
                  </div>
                  <h3 className="font-sora text-lg font-bold">{step.title}</h3>
                  <p className="text-sm text-[#494454] leading-relaxed">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Para empresas */}
        <section id="empresas" className="scroll-mt-20 max-w-6xl mx-auto px-4 lg:px-8 py-12 lg:py-20 grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6b38d4]">Para empresas</span>
            <h2 className="font-sora text-2xl lg:text-4xl font-bold tracking-tight">
              Um preço por pessoa. Terapia de verdade, toda semana.
            </h2>
            <p className="text-base text-[#494454] leading-relaxed">
              Sem tabela por faixa de uso e sem surpresa na fatura: você paga pelo número de funcionários cobertos.
            </p>
            <ul className="flex flex-col gap-2.5 mt-1">
              {COMPANY_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-sm lg:text-base">
                  <span className="material-symbols-outlined text-[1.375rem] text-[#006947] shrink-0">check_circle</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="card !p-6 lg:!p-8 flex flex-col gap-5 shadow-lg">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-sora text-5xl font-bold tracking-tight">
                {formatBRL(PRICING.companyPerEmployee)}
              </span>
              <span className="text-base text-[#494454]">por funcionário / mês</span>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="employees" className="text-sm font-semibold flex items-center justify-between">
                Quantos funcionários?
                <span className="font-sora text-lg font-bold text-[#6b38d4] tabular-nums">{employees}</span>
              </label>
              <input
                id="employees"
                type="range"
                min={MIN_EMPLOYEES}
                max={MAX_EMPLOYEES}
                step={5}
                value={employees}
                onChange={(e) => setEmployees(Number(e.target.value))}
                className="w-full accent-[#6b38d4] h-11 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-[#7b7486]">
                <span>{MIN_EMPLOYEES}</span>
                <span>{MAX_EMPLOYEES}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#eff4ff] flex items-center justify-between gap-3">
              <span className="text-sm text-[#494454]">Total por mês</span>
              <span className="font-sora text-2xl font-bold tabular-nums" aria-live="polite">
                {formatBRL(monthlyTotal)}
              </span>
            </div>

            <button
              onClick={() => setIsLeadOpen(true)}
              className="h-13 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              Falar com o time comercial
            </button>
          </div>
        </section>

        {/* Para psicólogos */}
        <section id="psicologos" className="scroll-mt-20 bg-gradient-to-br from-[#6b38d4] to-[#0051d5] text-white">
          <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12 lg:py-20 grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#dbe1ff]">Para psicólogos</span>
              <h2 className="font-sora text-2xl lg:text-4xl font-bold tracking-tight">
                Agenda cheia de pacientes recorrentes.
              </h2>
              <p className="text-base text-white/85 leading-relaxed">
                Você define os horários que quer atender. Os funcionários das empresas escolhem um horário fixo com você e voltam toda semana.
              </p>
              <ul className="flex flex-col gap-2.5 mt-1">
                {PSYCHOLOGIST_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-sm lg:text-base">
                    <span className="material-symbols-outlined text-[1.375rem] text-[#6ffbbe] shrink-0">check_circle</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl p-6 lg:p-8 bg-white text-[#0b1c30] flex flex-col gap-5 shadow-xl">
              <h3 className="font-sora text-xl lg:text-2xl font-bold tracking-tight">Como começar</h3>

              <ol className="flex flex-col gap-3 text-sm lg:text-base text-[#494454]">
                {PSYCHOLOGIST_STEPS.map((step, index) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#e9ddff] text-[#5516be] font-sora text-sm font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>

              <Link
                to="/entrar?perfil=psicologo&criar"
                className="h-13 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                Quero atender pelo Synapse
              </Link>
            </div>
          </div>
        </section>

        {/* Privacidade */}
        <section className="max-w-6xl mx-auto px-4 lg:px-8 py-12 lg:py-20 flex flex-col gap-8">
          <div className="max-w-2xl">
            <h2 className="font-sora text-2xl lg:text-4xl font-bold tracking-tight">
              Sigilo vem antes de tudo
            </h2>
            <p className="text-base text-[#494454] mt-2">
              As pessoas só usam um benefício de saúde mental quando confiam que ninguém da empresa está olhando.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
            {PRIVACY_POINTS.map((point) => (
              <div key={point.title} className="card flex flex-col gap-2">
                <span className="w-11 h-11 rounded-2xl bg-[#dbe1ff]/70 text-[#0051d5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[1.6875rem]">{point.icon}</span>
                </span>
                <h3 className="font-sora text-base font-bold mt-1">{point.title}</h3>
                <p className="text-sm text-[#494454] leading-relaxed">{point.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Dúvidas */}
        <section id="duvidas" className="scroll-mt-20 bg-white border-y border-[#e5eeff]">
          <div className="max-w-3xl mx-auto px-4 lg:px-8 py-12 lg:py-20 flex flex-col gap-6">
            <h2 className="font-sora text-2xl lg:text-4xl font-bold tracking-tight">Dúvidas frequentes</h2>
            <div className="flex flex-col gap-2">
              {FAQ.map((item) => (
                <details key={item.q} className="group rounded-2xl border border-[#e5eeff] bg-[#f8f9ff] open:bg-white">
                  <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-3 font-semibold text-sm lg:text-base rounded-2xl">
                    {item.q}
                    <span className="material-symbols-outlined text-[1.5rem] text-[#6b38d4] shrink-0 transition-transform group-open:rotate-180">
                      expand_more
                    </span>
                  </summary>
                  <p className="px-4 pb-4 text-sm lg:text-base text-[#494454] leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-4 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-[#494454]">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span>© {new Date().getFullYear()} Synapse</span>
          <button
            type="button"
            onClick={() => setIsTermsOpen(true)}
            className="ml-2 font-semibold text-[#5516be] underline underline-offset-2 rounded"
          >
            Termo e privacidade (LGPD)
          </button>
        </div>
        <p>
          Em crise? Ligue <a href="tel:188" className="font-semibold text-[#ba1a1a] underline">188</a> (CVV), 24 horas, gratuito.
        </p>
      </footer>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />

      <Modal
        isOpen={isLeadOpen}
        onClose={() => setIsLeadOpen(false)}
        label="Contratar o Synapse para minha empresa"
        maxWidth="max-w-lg"
      >
        <LeadForm initialEmployees={employees} onClose={() => setIsLeadOpen(false)} />
      </Modal>
    </div>
  );
};

const FIELD_CLASS =
  'h-12 px-4 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff] text-base text-[#0b1c30] placeholder:text-[#7b7486] focus:outline-none focus:border-[#6b38d4] focus:ring-2 focus:ring-[#6b38d4]/20';

const LeadForm: React.FC<{ initialEmployees: number; onClose: () => void }> = ({ initialEmployees, onClose }) => {
  const showToast = useToast();
  const [employees, setEmployees] = useState(String(initialEmployees));
  const count = Math.max(0, Number(employees) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Recebemos seu contato. Nosso time comercial fala com você em breve.');
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#6b38d4]">Para empresas</span>
          <h3 className="font-sora text-xl font-bold">Leve o Synapse para o seu time</h3>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="lead-name" className="text-sm font-semibold">Seu nome</label>
        <input id="lead-name" name="name" required autoComplete="name" className={FIELD_CLASS} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lead-company" className="text-sm font-semibold">Empresa</label>
        <input id="lead-company" name="company" required autoComplete="organization" className={FIELD_CLASS} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lead-email" className="text-sm font-semibold">E-mail de trabalho</label>
        <input id="lead-email" name="email" type="email" required autoComplete="email" className={FIELD_CLASS} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lead-employees" className="text-sm font-semibold">Número de funcionários</label>
        <input
          id="lead-employees"
          name="employees"
          type="number"
          min={1}
          required
          inputMode="numeric"
          value={employees}
          onChange={(e) => setEmployees(e.target.value)}
          className={FIELD_CLASS}
        />
      </div>

      <div className="p-4 rounded-2xl bg-[#eff4ff] flex items-center justify-between gap-3">
        <span className="text-sm text-[#494454]">
          {count} × {formatBRL(PRICING.companyPerEmployee)} por mês
        </span>
        <span className="font-sora text-xl font-bold tabular-nums">
          {formatBRL(count * PRICING.companyPerEmployee)}
        </span>
      </div>

      <button
        type="submit"
        className="h-12 min-h-12 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-semibold transition-colors"
      >
        Enviar
      </button>
    </form>
  );
};
