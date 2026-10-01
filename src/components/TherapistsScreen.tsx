import React, { useState } from 'react';
import { Therapist } from '../types';
import { sound } from '../utils/audio';
import { formatRecurring } from '../utils/schedule';
import { useEmployeePlan } from '../areas/employee/plan';
import { ScheduleMode } from './ScheduleModal';
import { TherapistCard } from './TherapistCard';

interface TherapistsScreenProps {
  onSchedule: (therapist: Therapist, mode?: ScheduleMode) => void;
  onViewProfile: (therapist: Therapist) => void;
}

const mentions = (th: Therapist, pattern: RegExp) =>
  pattern.test(th.bio) || pattern.test(th.title) || th.tags.some((t) => pattern.test(t.label));

const FILTERS: { id: string; label: string; icon: string; matches: (th: Therapist) => boolean }[] = [
  { id: 'all', label: 'Todos', icon: 'all_inclusive', matches: () => true },
  {
    id: 'today',
    label: 'Disponível hoje',
    icon: 'schedule',
    matches: (th) => th.weeklyAvailability.some((slot) => slot.weekday === new Date().getDay()),
  },
  {
    id: 'burnout',
    label: 'Burnout & Carreira',
    icon: 'psychology_alt',
    matches: (th) => th.tags.some((t) => t.category === 'burnout') || mentions(th, /burnout|esgotamento|carreira/i),
  },
  {
    id: 'anxiety',
    label: 'Ansiedade & Estresse',
    icon: 'self_improvement',
    matches: (th) => mentions(th, /ansiedade|estresse|cortisol/i),
  },
  {
    id: 'sleep',
    label: 'Sono',
    icon: 'bedtime',
    matches: (th) => th.tags.some((t) => t.category === 'sleep'),
  },
  {
    id: 'medical',
    label: 'Psiquiatria',
    icon: 'stethoscope',
    matches: (th) => th.tags.some((t) => t.category === 'medical'),
  },
];

export const TherapistsScreen: React.FC<TherapistsScreenProps> = ({ onSchedule, onViewProfile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { plan, therapist: myTherapist, therapists, doneThisWeek } = useEmployeePlan();

  const term = searchTerm.trim().toLowerCase();
  const activeFilter = FILTERS.find((f) => f.id === selectedFilter) ?? FILTERS[0];

  const filteredTherapists = therapists.filter((th) => {
    const matchesSearch =
      !term ||
      th.name.toLowerCase().includes(term) ||
      th.title.toLowerCase().includes(term) ||
      th.bio.toLowerCase().includes(term) ||
      th.tags.some((t) => t.label.toLowerCase().includes(term));

    return matchesSearch && activeFilter.matches(th);
  }).sort((a, b) => Number(b.id === myTherapist?.id) - Number(a.id === myTherapist?.id));

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedFilter('all');
  };

  return (
    <div className="screen">
      {/* Chamada principal + busca */}
      <section className="relative overflow-hidden rounded-3xl p-5 lg:p-8 bg-gradient-to-br from-[#6b38d4] to-[#0051d5] text-white">
        <div className="absolute -right-12 -bottom-16 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex flex-col gap-4 max-w-2xl">
          <div className="flex flex-col gap-1">
            <span className="font-outfit text-xs font-semibold uppercase tracking-wider text-[#dbe1ff]">
              Seu plano está ativo
            </span>
            <h1 className="font-sora text-2xl lg:text-3xl font-bold tracking-tight leading-tight">
              Seu psicólogo, toda semana
            </h1>
            <p className="font-outfit text-sm lg:text-base text-white/85 leading-snug">
              Seu plano cobre 1 sessão por semana, paga pela sua empresa. Escolha um profissional e um horário fixo; a empresa nunca sabe quando ou com quem você consulta.
            </p>
          </div>

          <div className="relative w-full">
            <label className="sr-only" htmlFor="search-input">
              Buscar profissionais de saúde mental
            </label>
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#7b7486]">
              <span className="material-symbols-outlined text-[22px]">search</span>
            </span>
            <input
              id="search-input"
              type="text"
              inputMode="search"
              autoComplete="off"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou especialidade"
              className="w-full h-13 pl-12 pr-12 bg-white text-[#0b1c30] placeholder:text-[#7b7486] text-sm lg:text-base font-outfit rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-white/40 transition-shadow"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                aria-label="Limpar busca"
                className="absolute inset-y-0 right-1.5 my-auto w-10 h-10 rounded-full flex items-center justify-center text-[#494454] hover:bg-[#eff4ff]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filtros rápidos */}
      <div
        role="group"
        aria-label="Filtrar por especialidade"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap py-1"
      >
        {FILTERS.map((filter) => {
          const isActive = selectedFilter === filter.id;
          const count = therapists.filter(filter.matches).length;
          return (
            <button
              key={filter.id}
              aria-pressed={isActive}
              onClick={() => {
                setSelectedFilter(filter.id);
                sound.playChime('click');
              }}
              className={`shrink-0 h-11 px-4 rounded-full font-outfit text-sm font-semibold flex items-center gap-1.5 active:scale-95 transition-all border ${
                isActive
                  ? 'bg-[#6b38d4] text-white border-[#6b38d4]'
                  : 'bg-white text-[#494454] hover:text-[#0b1c30] border-[#e5eeff] hover:border-[#6b38d4]/30'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${isActive ? '' : 'text-[#6b38d4]'}`}>
                {filter.icon}
              </span>
              <span>{filter.label}</span>
              <span className={`text-xs font-medium ${isActive ? 'text-white/80' : 'text-[#7b7486]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lista de profissionais */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-sora text-base lg:text-lg text-[#0b1c30] font-bold">
            Psicólogos do seu plano
          </h2>
          <span className="font-outfit text-sm text-[#494454] shrink-0" aria-live="polite">
            {filteredTherapists.length}{' '}
            {filteredTherapists.length === 1 ? 'profissional' : 'profissionais'}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {filteredTherapists.map((therapist) => {
            const isCurrent = therapist.id === myTherapist?.id;
            return (
              <TherapistCard
                key={therapist.id}
                therapist={therapist}
                isCurrent={isCurrent}
                currentLabel={isCurrent && plan ? formatRecurring(plan.weekday, plan.time) : undefined}
                actions={
                  isCurrent ? (
                    <>
                      <button
                        type="button"
                        disabled={doneThisWeek}
                        onClick={() => onSchedule(therapist, 'reschedule')}
                        className="flex-1 h-12 px-4 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold whitespace-nowrap flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:bg-[#cbc3d7] disabled:active:scale-100"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {doneThisWeek ? 'check' : 'event_repeat'}
                        </span>
                        <span>{doneThisWeek ? 'Semana realizada' : 'Remarcar a semana'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSchedule(therapist, 'choose')}
                        className="flex-1 h-12 px-4 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-outfit text-sm font-medium whitespace-nowrap flex items-center justify-center active:scale-[0.98] transition-all"
                      >
                        Mudar horário fixo
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onSchedule(therapist, 'choose')}
                        className="flex-1 h-12 px-4 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                      >
                        <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
                        <span>Escolher</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onViewProfile(therapist)}
                        aria-label={`Ver perfil de ${therapist.name}`}
                        className="h-12 px-4 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-outfit text-sm font-medium flex items-center justify-center active:scale-[0.98] transition-all shrink-0"
                      >
                        Ver perfil
                      </button>
                    </>
                  )
                }
              />
            );
          })}
        </div>

        {filteredTherapists.length === 0 && (
          <div className="card !p-8 text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[36px] text-[#7b7486]">search_off</span>
            <h3 className="font-sora text-base font-bold text-[#0b1c30]">
              Nenhum especialista encontrado
            </h3>
            <p className="text-sm text-[#494454] font-outfit">
              Tente outro termo ou remova os filtros.
            </p>
            <button
              onClick={clearFilters}
              className="mt-2 h-11 px-5 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be] text-sm font-outfit font-semibold transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>

      {/* Garantia de sigilo */}
      <aside className="bg-[#eff4ff] rounded-3xl p-5 flex flex-col gap-2 border border-[#dce9ff]">
        <div className="flex items-center gap-2 text-[#0b1c30] font-semibold font-outfit text-sm">
          <span className="material-symbols-outlined text-[20px] text-[#6b38d4]">lock</span>
          <span>Privacidade e sigilo profissional</span>
        </div>
        <p className="font-outfit text-sm text-[#494454] leading-relaxed max-w-3xl">
          As sessões acontecem por teleconsulta criptografada de ponta a ponta, com prontuário sob sigilo ético do Conselho Federal de Psicologia (CFP).{' '}
          <strong>Sua empresa nunca saberá quando ou com quem você consulta.</strong>
        </p>
        <div className="flex items-center gap-4 pt-1 text-[#494454] font-outfit text-xs flex-wrap">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-[#006947]">check_circle</span>
            Profissionais com CRP/CRM verificado
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-[#006947]">check_circle</span>
            ISO 27001 para dados de saúde
          </span>
        </div>
      </aside>
    </div>
  );
};
