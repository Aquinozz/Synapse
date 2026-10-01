import React, { useEffect, useRef, useState } from 'react';
import { TEAMS_DATA, KPIS_BY_DEPARTMENT, DEPARTMENT_NAMES } from '../data/mockData';
import { DepartmentScope } from '../types';
import { sound } from '../utils/audio';

interface ManagementScreenProps {
  onOpenReportModal: (dept: DepartmentScope) => void;
}

const DEPARTMENTS: DepartmentScope[] = ['all', 'engineering', 'sales', 'marketing', 'operations'];

const PERIOD_NAMES: Record<string, string> = {
  '7days': 'Últimos 7 dias',
  '30days': 'Últimos 30 dias',
  quarter: 'Trimestre atual',
  year: `Ano de ${new Date().getFullYear()}`,
};

export const ManagementScreen: React.FC<ManagementScreenProps> = ({
  onOpenReportModal,
}) => {
  const [selectedDept, setSelectedDept] = useState<DepartmentScope>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30days');
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [protocolAdopted, setProtocolAdopted] = useState(false);

  const filtersRef = useRef<HTMLDivElement>(null);

  const kpis = KPIS_BY_DEPARTMENT[selectedDept] || KPIS_BY_DEPARTMENT.all;
  const teams = TEAMS_DATA[selectedDept] || TEAMS_DATA.all;

  const deptLabel = (d: DepartmentScope) =>
    `${DEPARTMENT_NAMES[d]} (${KPIS_BY_DEPARTMENT[d].totalEmployees})`;

  // In these mock deltas a rising wellness index is good and a rising burnout risk is bad
  const wellnessImproved = !kpis.wellnessDelta.startsWith('-');
  const burnoutImproved = kpis.burnoutDelta.startsWith('-');

  // Close the filter menus on outside click or Esc
  const isMenuOpen = showDeptDropdown || showPeriodDropdown;
  useEffect(() => {
    if (!isMenuOpen) return;
    const close = () => {
      setShowDeptDropdown(false);
      setShowPeriodDropdown(false);
    };
    const handlePointerDown = (e: PointerEvent) => {
      if (!filtersRef.current?.contains(e.target as Node)) close();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleAdoptProtocol = () => {
    sound.playChime('success');
    setProtocolAdopted(!protocolAdopted);
  };

  return (
    <div className="screen">
      {/* Header de Gestão e Controles Executivos */}
      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex flex-col min-w-0">
            <h1 className="font-sora text-2xl lg:text-3xl text-[#0b1c30] font-bold tracking-tight">
              Gestão de Resiliência
            </h1>
            <p className="font-outfit text-sm lg:text-base text-[#494454]">
              Painel executivo com dados agregados e anônimos.
            </p>
          </div>

          <button
            onClick={() => onOpenReportModal(selectedDept)}
            className="hidden lg:flex h-11 px-5 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold items-center gap-2 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
            <span>Exportar relatório</span>
          </button>
        </div>

        {/* Filtros: Escopo e Período */}
        <div ref={filtersRef} className="grid grid-cols-1 sm:grid-cols-2 gap-2 relative lg:max-w-xl">
          {/* Scope Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDeptDropdown(!showDeptDropdown);
                setShowPeriodDropdown(false);
              }}
              aria-haspopup="listbox"
              aria-expanded={showDeptDropdown}
              aria-label={`Equipe: ${deptLabel(selectedDept)}`}
              className="w-full h-11 flex items-center justify-between px-3 rounded-2xl bg-white text-[#0b1c30] border border-[#e5eeff] hover:border-[#6b38d4]/30 text-left text-sm font-outfit font-semibold active:bg-[#eff4ff] transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-[18px] text-[#6b38d4] shrink-0">
                  groups
                </span>
                <span className="truncate">{deptLabel(selectedDept)}</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-[#494454] shrink-0">
                expand_more
              </span>
            </button>

            {showDeptDropdown && (
              <div role="listbox" className="absolute top-12 left-0 z-30 min-w-full w-max max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-[#e5eeff] py-1 text-sm font-outfit animate-fade-in">
                {DEPARTMENTS.map(
                  (d) => (
                    <button
                      key={d}
                      role="option"
                      aria-selected={selectedDept === d}
                      onClick={() => {
                        setSelectedDept(d);
                        setShowDeptDropdown(false);
                        sound.playChime('click');
                      }}
                      className={`w-full px-3 py-2.5 text-left flex items-center justify-between gap-3 hover:bg-[#eff4ff] ${
                        selectedDept === d ? 'text-[#6b38d4] font-bold bg-[#f8f9ff]' : 'text-[#0b1c30]'
                      }`}
                    >
                      <span>{deptLabel(d)}</span>
                      {selectedDept === d && (
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Period Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowPeriodDropdown(!showPeriodDropdown);
                setShowDeptDropdown(false);
              }}
              aria-haspopup="listbox"
              aria-expanded={showPeriodDropdown}
              aria-label={`Período: ${PERIOD_NAMES[selectedPeriod]}`}
              className="w-full h-11 flex items-center justify-between px-3 rounded-2xl bg-white text-[#0b1c30] border border-[#e5eeff] hover:border-[#6b38d4]/30 text-left text-sm font-outfit font-semibold active:bg-[#eff4ff] transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-[18px] text-[#0051d5] shrink-0">
                  calendar_month
                </span>
                <span className="truncate">{PERIOD_NAMES[selectedPeriod]}</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-[#494454] shrink-0">
                expand_more
              </span>
            </button>

            {showPeriodDropdown && (
              <div role="listbox" className="absolute top-12 right-0 z-30 min-w-full w-max bg-white rounded-2xl shadow-xl border border-[#e5eeff] py-1 text-sm font-outfit animate-fade-in">
                {Object.entries(PERIOD_NAMES).map(([key, name]) => (
                  <button
                    key={key}
                    role="option"
                    aria-selected={selectedPeriod === key}
                    onClick={() => {
                      setSelectedPeriod(key);
                      setShowPeriodDropdown(false);
                      sound.playChime('click');
                    }}
                    className={`w-full px-3 py-2.5 text-left flex items-center justify-between gap-3 hover:bg-[#eff4ff] ${
                      selectedPeriod === key
                        ? 'text-[#0051d5] font-bold bg-[#f8f9ff]'
                        : 'text-[#0b1c30]'
                    }`}
                  >
                    <span>{name}</span>
                    {selectedPeriod === key && (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alerta Ético Explícito */}
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-[#eff4ff] text-[#494454] border border-[#dce9ff]">
          <span className="material-symbols-outlined text-[#0051d5] text-[18px] shrink-0 mt-0.5 fill-1">
            verified_user
          </span>
          <p className="font-outfit text-sm leading-snug">
            <strong className="font-semibold text-[#0051d5]">Dados anônimos (LGPD):</strong>{' '}
            as métricas são sempre agregadas, com no mínimo 5 respostas por equipe. Nenhum colaborador é identificado.
          </p>
        </div>
      </section>

      {/* Painel de KPIs Principais (Grid 2x2 com Sparklines) */}
      <section aria-label="Indicadores principais" className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {/* KPI 1: Índice Geral de Bem-Estar */}
        <div className="card !p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-outfit text-xs text-[#494454] font-medium">Bem-Estar Geral</span>
            <span className="material-symbols-outlined text-[18px] text-[#00855b]">
              sentiment_satisfied
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="font-sora text-2xl font-bold text-[#0b1c30] tracking-tight">
                {kpis.wellnessIndex}
              </span>
              <span className="font-outfit text-xs text-[#494454]">/100</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`material-symbols-outlined text-[16px] ${wellnessImproved ? 'text-[#00855b]' : 'text-[#ba1a1a]'}`}>
                {wellnessImproved ? 'trending_up' : 'trending_down'}
              </span>
              <span className={`font-outfit text-xs font-semibold ${wellnessImproved ? 'text-[#00855b]' : 'text-[#ba1a1a]'}`}>
                {kpis.wellnessDelta}
              </span>
            </div>
          </div>
          {/* Sparkline SVG */}
          <svg
            className="w-full h-5 text-[#00855b]"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 100 24"
          >
            <path
              d="M0,18 Q20,16 35,10 T70,12 T100,3"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
            <path
              d="M0,18 Q20,16 35,10 T70,12 T100,3 L100,24 L0,24 Z"
              fill="currentColor"
              fillOpacity="0.12"
            />
          </svg>
        </div>

        {/* KPI 2: Adesão aos Cuidados */}
        <div className="card !p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-outfit text-xs text-[#494454] font-medium">Adesão Ativa</span>
            <span className="material-symbols-outlined text-[18px] text-[#0051d5]">
              how_to_reg
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="font-sora text-2xl font-bold text-[#0b1c30] tracking-tight">
                {kpis.activeAdoptionPct}%
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px] text-[#0051d5] font-bold">
                people
              </span>
              <span className="font-outfit text-xs text-[#494454] truncate">
                {kpis.activeMembers} membros ativos
              </span>
            </div>
          </div>
          {/* Progress Bar Micro Indicator */}
          <div className="w-full bg-[#eff4ff] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#0051d5] h-full rounded-full transition-all duration-700"
              style={{ width: `${kpis.activeAdoptionPct}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Risco de Burnout */}
        <div className="card !p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-outfit text-xs text-[#494454] font-medium">Risco de Burnout</span>
            <span className="material-symbols-outlined text-[18px] text-[#6b38d4]">
              psychology_alt
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="font-sora text-2xl font-bold text-[#0b1c30] tracking-tight">
                {kpis.burnoutRiskPct}%
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`material-symbols-outlined text-[16px] ${burnoutImproved ? 'text-[#00855b]' : 'text-[#ba1a1a]'}`}>
                {burnoutImproved ? 'trending_down' : 'trending_up'}
              </span>
              <span className={`font-outfit text-xs font-semibold truncate ${burnoutImproved ? 'text-[#00855b]' : 'text-[#ba1a1a]'}`}>
                {kpis.burnoutDelta}
              </span>
            </div>
          </div>
          {/* Sparkline SVG */}
          <svg
            className="w-full h-5 text-[#6b38d4]"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 100 24"
          >
            <path
              d="M0,6 Q25,8 50,14 T80,18 T100,20"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
            <path
              d="M0,6 Q25,8 50,14 T80,18 T100,20 L100,24 L0,24 Z"
              fill="currentColor"
              fillOpacity="0.12"
            />
          </svg>
        </div>

        {/* KPI 4: Sessões Realizadas */}
        <div className="card !p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-outfit text-xs text-[#494454] font-medium">Sessões / Mês</span>
            <span className="material-symbols-outlined text-[18px] text-[#8455ef]">
              support_agent
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="font-sora text-2xl font-bold text-[#0b1c30] tracking-tight">
                {kpis.monthlySessions}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px] text-[#00855b] font-bold">
                check_circle
              </span>
              <span className="font-outfit text-xs text-[#494454]">100% confidenciais</span>
            </div>
          </div>
          {/* Dual mini bar indicator */}
          <div className="flex gap-1 items-end h-5 w-full pt-1">
            <div className="flex-1 bg-[#dce9ff] rounded-t-sm h-3" />
            <div className="flex-1 bg-[#dce9ff] rounded-t-sm h-3.5" />
            <div className="flex-1 bg-[#dce9ff] rounded-t-sm h-2.5" />
            <div className="flex-1 bg-[#dce9ff] rounded-t-sm h-4" />
            <div className="flex-1 bg-[#6b38d4] rounded-t-sm h-5" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 items-start">
      {/* Seção: Distribuição por Equipes */}
      <section className="card flex flex-col gap-3 lg:col-span-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="font-sora text-base font-bold text-[#0b1c30]">
              Distribuição por Equipes
            </h3>
            <span className="font-outfit text-sm text-[#494454]">
              Como cada equipe está em saúde e risco
            </span>
          </div>
        </div>

        {/* Legenda Acessível */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-6 py-2 px-3 rounded-2xl bg-[#eff4ff] text-[#494454]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00855b]" />
            <span className="font-outfit text-[10px] uppercase font-bold text-[#006947]">
              Saudável
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#316bf3]" />
            <span className="font-outfit text-[10px] uppercase font-bold text-[#0051d5]">
              Moderado
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]" />
            <span className="font-outfit text-[10px] uppercase font-bold text-[#ba1a1a]">
              Risco Elevado
            </span>
          </div>
        </div>

        {/* Lista de Equipes com barras empilhadas */}
        <div className="flex flex-col gap-3.5 pt-1">
          {teams.map((team) => (
            <div key={team.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-outfit text-sm font-semibold text-[#0b1c30]">
                  {team.name}
                  <span className="font-normal text-xs text-[#7b7486]"> · {team.memberCount} pessoas</span>
                </span>
                <div className="flex items-center gap-1 font-outfit text-xs text-[#494454]">
                  <span className="material-symbols-outlined text-[14px] text-[#00855b] font-bold">
                    check
                  </span>
                  <span>{team.healthyPct}% Saudável</span>
                  <span className="text-[#494454]/40">•</span>
                  <span className={`font-semibold ${team.riskPct > 15 ? 'text-[#ba1a1a]' : team.riskPct > 10 ? 'text-[#c05621]' : 'text-[#00855b]'}`}>
                    {team.riskPct}% em risco
                  </span>
                </div>
              </div>

              {/* Stacked bar */}
              <div className="w-full h-3 rounded-full bg-[#eff4ff] flex overflow-hidden shadow-inner">
                <div
                  className="bg-[#00855b] h-full transition-all duration-500"
                  style={{ width: `${team.healthyPct}%` }}
                  title={`${team.healthyPct}% Saudável`}
                />
                <div
                  className="bg-[#316bf3] h-full transition-all duration-500"
                  style={{ width: `${team.moderatePct}%` }}
                  title={`${team.moderatePct}% Moderado`}
                />
                <div
                  className="bg-[#ba1a1a] h-full transition-all duration-500"
                  style={{ width: `${team.riskPct}%` }}
                  title={`${team.riskPct}% Risco Elevado`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-4 lg:gap-6 lg:col-span-2">
      {/* Seção: Retorno & Eficiência (ROI) - Dark Slate Elegante */}
      <section className="relative overflow-hidden p-5 rounded-3xl bg-[#213145] text-[#eaf1ff]">
        {/* Ambient Neural Glow Accent */}
        <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-[#8455ef]/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#6ffbbe] text-[20px] fill-1">
                monetization_on
              </span>
              <h3 className="font-sora text-base text-[#eaf1ff] font-bold">
                Retorno & Eficiência (ROI)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#4edea3]/20 text-[#6ffbbe] font-outfit text-[11px] font-semibold uppercase tracking-wider">
              Auditado
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 pt-1">
            {/* Retorno 1 */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#0b1c30]/40 backdrop-blur-sm border border-white/5">
              <div className="w-10 h-10 rounded-full bg-[#00855b]/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#6ffbbe] text-[22px]">savings</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-outfit text-xs text-[#eaf1ff]/70 truncate">
                  Economia em turnover evitado
                </span>
                <span className="font-sora text-lg font-bold text-[#6ffbbe]">
                  {kpis.savingsRoi}
                </span>
              </div>
            </div>

            {/* Retorno 2 */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#0b1c30]/40 backdrop-blur-sm border border-white/5">
              <div className="w-10 h-10 rounded-full bg-[#316bf3]/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#dbe1ff] text-[22px]">
                  medical_services
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-outfit text-xs text-[#eaf1ff]/70 truncate">
                  Afastamentos e absenteísmo
                </span>
                <div className="flex items-baseline gap-x-1.5 flex-wrap">
                  <span className="font-sora text-lg font-bold text-[#dbe1ff] whitespace-nowrap">
                    Queda de {kpis.leaveReductionPct}%
                  </span>
                  <span className="font-outfit text-xs text-[#eaf1ff]/80">em licenças de saúde</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção: Recomendações da Synapse AI para Gestão */}
      <section className="card flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 shrink-0 rounded-full bg-[#e9ddff] flex items-center justify-center text-[#6b38d4]">
            <span className="material-symbols-outlined text-[20px]">neurology</span>
          </div>
          <div>
            <h3 className="font-sora text-base font-bold text-[#0b1c30]">
              Recomendações da Synapse AI
            </h3>
            <p className="font-outfit text-xs text-[#494454]">
              Insights preditivos acionáveis para líderes
            </p>
          </div>
        </div>

        {/* Cartão de Sugestão Preditiva */}
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[#eff4ff] text-[#0b1c30] border border-[#dce9ff]">
          <div className="flex items-center gap-1.5 text-[#6b38d4] font-semibold">
            <span className="material-symbols-outlined text-[18px]">lightbulb</span>
            <span className="font-outfit text-xs font-bold">Alerta Preventivo: Setor Comercial</span>
          </div>
          <p className="font-outfit text-sm text-[#494454] leading-relaxed">
            Pico concentrado de esgotamento e exaustão emocional detectado consistentemente às{' '}
            <strong>sextas-feiras</strong>. Sugerimos instituir a política de{' '}
            <strong>"No-Meeting Friday"</strong> quinzenal e promover pausas somáticas integradas no Teams/Slack.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAdoptProtocol}
              aria-pressed={protocolAdopted}
              className={`h-10 px-4 rounded-full font-outfit text-sm font-semibold active:scale-95 transition-all flex items-center gap-1.5 ${
                protocolAdopted
                  ? 'bg-[#00855b] text-white'
                  : 'bg-[#6b38d4] text-white hover:bg-[#8455ef]'
              }`}
            >
              <span>{protocolAdopted ? 'Protocolo ativado' : 'Adotar protocolo'}</span>
              <span className="material-symbols-outlined text-[15px]">
                {protocolAdopted ? 'done_all' : 'arrow_forward'}
              </span>
            </button>
          </div>
        </div>

        {/* Ação Primária: Exportar Relatório Executivo */}
        <button
          onClick={() => onOpenReportModal(selectedDept)}
          className="lg:hidden w-full h-12 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-all mt-1"
        >
          <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
          <span>Exportar relatório (ESG/CIPA)</span>
        </button>
      </section>
      </div>
      </div>
    </div>
  );
};
