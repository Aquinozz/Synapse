import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Therapist } from '../types';
import { sound } from '../utils/audio';
import { formatRecurring } from '../utils/schedule';
import { useEmployeePlan } from '../areas/employee/plan';
import { MultiSelect, MultiSelectOption } from './MultiSelect';
import { ScheduleMode } from './ScheduleModal';
import { TherapistCard } from './TherapistCard';

interface TherapistsScreenProps {
  onSchedule: (therapist: Therapist, mode?: ScheduleMode) => void;
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** The values of one field found across the directory, most common first, with how many have each */
const optionsOf = (therapists: Therapist[], field: 'specialties' | 'approaches' | 'languages'): MultiSelectOption[] => {
  const counts = new Map<string, number>();
  for (const therapist of therapists) {
    for (const value of therapist[field]) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
    .map(([value, count]) => ({ value, count }));
};

/** Within one filter any chosen option is enough; different filters must all match */
const matchesAny = (values: string[], chosen: string[]) =>
  chosen.length === 0 || chosen.some((value) => values.includes(value));

export const TherapistsScreen: React.FC<TherapistsScreenProps> = ({ onSchedule }) => {
  const { plan, therapist: myTherapist, therapists, doneThisWeek } = useEmployeePlan();
  // The filters live in the address, so coming back from a psychologist's page finds them as they were
  const [params, setParams] = useSearchParams();
  // What is typed is kept here as well: the address updates a moment later, and a field tied to it drops letters
  const [searchTerm, setSearchTermState] = useState(params.get('busca') ?? '');
  const specialties = params.getAll('especialidade');
  const approaches = params.getAll('abordagem');
  const languages = params.getAll('idioma');
  const onlyToday = params.get('hoje') === '1';
  const [showMore, setShowMore] = useState(languages.length > 0 || onlyToday);

  const setFilter = (key: string, values: string[]) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete(key);
        values.filter(Boolean).forEach((value) => next.append(key, value));
        return next;
      },
      { replace: true }
    );
  const setSearchTerm = (value: string) => {
    setSearchTermState(value);
    setFilter('busca', [value]);
  };
  const setSpecialties = (values: string[]) => setFilter('especialidade', values);
  const setApproaches = (values: string[]) => setFilter('abordagem', values);
  const setLanguages = (values: string[]) => setFilter('idioma', values);
  const setOnlyToday = (value: boolean) => setFilter('hoje', value ? ['1'] : []);

  const term = normalize(searchTerm.trim());
  const today = new Date().getDay();

  const filteredTherapists = therapists
    .filter((th) => {
      const matchesSearch =
        !term ||
        [th.name, th.title, th.bio, ...th.specialties, ...th.approaches].some((text) => normalize(text).includes(term));
      return (
        matchesSearch &&
        matchesAny(th.specialties, specialties) &&
        matchesAny(th.approaches, approaches) &&
        matchesAny(th.languages, languages) &&
        (!onlyToday || th.weeklyAvailability.some((slot) => slot.weekday === today))
      );
    })
    .sort((a, b) => Number(b.id === myTherapist?.id) - Number(a.id === myTherapist?.id));

  // Every active filter as a removable chip
  const activeFilters = [
    ...specialties.map((value) => ({ value, remove: () => setSpecialties(specialties.filter((v) => v !== value)) })),
    ...approaches.map((value) => ({ value, remove: () => setApproaches(approaches.filter((v) => v !== value)) })),
    ...languages.map((value) => ({ value, remove: () => setLanguages(languages.filter((v) => v !== value)) })),
    ...(onlyToday ? [{ value: 'Disponível hoje', remove: () => setOnlyToday(false) }] : []),
  ];
  const hasFilters = activeFilters.length > 0 || term !== '';

  const clearFilters = () => {
    setSearchTermState('');
    setParams({}, { replace: true });
  };

  return (
    <div className="screen">
      {/* Chamada principal + filtros */}
      <section className="relative rounded-3xl p-5 lg:p-8 bg-gradient-to-br from-[#6b38d4] to-[#0051d5] text-white">
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute -right-12 -bottom-16 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
        </div>
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col gap-1 max-w-2xl">
            <span className="font-outfit text-xs font-semibold uppercase tracking-wider text-[#dbe1ff]">
              Seu plano está ativo
            </span>
            <h1 className="font-sora text-2xl lg:text-3xl font-bold tracking-tight leading-tight">
              Encontre seu psicólogo
            </h1>
            <p className="font-outfit text-sm lg:text-base text-white/85 leading-snug">
              Seu plano cobre 1 sessão por semana, paga pela sua empresa. Ela nunca sabe quando ou com quem você consulta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <MultiSelect
              label="Especialidades"
              placeholder="Ansiedade, Burnout..."
              options={optionsOf(therapists, 'specialties')}
              selected={specialties}
              onChange={setSpecialties}
            />
            <MultiSelect
              label="Abordagens"
              placeholder="TCC, Psicanálise..."
              options={optionsOf(therapists, 'approaches')}
              selected={approaches}
              onChange={setApproaches}
            />

            {showMore && (
              <>
                <MultiSelect
                  label="Idiomas"
                  placeholder="Português, Libras..."
                  options={optionsOf(therapists, 'languages')}
                  selected={languages}
                  onChange={setLanguages}
                />
                <div className="flex flex-col gap-1.5">
                  <span className="font-outfit text-xs font-semibold uppercase tracking-wider text-[#dbe1ff]">
                    Disponibilidade
                  </span>
                  <label className="h-13 px-4 rounded-2xl bg-white flex items-center gap-3 cursor-pointer shadow-sm has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-white/40">
                    <input
                      type="checkbox"
                      checked={onlyToday}
                      onChange={(e) => {
                        setOnlyToday(e.target.checked);
                        sound.playChime('click');
                      }}
                      className="w-5 h-5 shrink-0 accent-[#6b38d4]"
                    />
                    <span className="font-outfit text-sm lg:text-base text-[#0b1c30]">Tem horário livre hoje</span>
                  </label>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <label className="sr-only" htmlFor="search-input">
                Buscar por nome
              </label>
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#7b7486]">
                <span className="material-symbols-outlined text-[1.5rem]">search</span>
              </span>
              <input
                id="search-input"
                type="text"
                inputMode="search"
                autoComplete="off"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome"
                className="w-full h-13 pl-12 pr-12 bg-white text-[#0b1c30] placeholder:text-[#7b7486] text-sm lg:text-base font-outfit rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-white/40 transition-shadow"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  aria-label="Limpar busca"
                  className="absolute inset-y-0 right-1.5 my-auto w-10 h-10 rounded-full flex items-center justify-center text-[#494454] hover:bg-[#eff4ff]"
                >
                  <span className="material-symbols-outlined text-[1.25rem]">close</span>
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              aria-expanded={showMore}
              className="h-13 px-5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-outfit text-sm font-semibold flex items-center justify-center gap-2 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[1.375rem]">tune</span>
              {showMore ? 'Menos filtros' : 'Mais filtros'}
            </button>
          </div>
        </div>
      </section>

      {/* Filtros ativos */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap" aria-label="Filtros ativos">
          {activeFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={filter.remove}
              aria-label={`Remover filtro ${filter.value}`}
              className="h-10 pl-4 pr-2.5 rounded-full bg-[#e9ddff]/70 hover:bg-[#e9ddff] text-[#5516be] font-outfit text-sm font-semibold flex items-center gap-1 transition-colors"
            >
              {filter.value}
              <span className="material-symbols-outlined text-[1.25rem]">close</span>
            </button>
          ))}
          <button
            onClick={clearFilters}
            className="h-10 px-3 rounded-full text-[#494454] hover:bg-[#eff4ff] font-outfit text-sm font-medium underline underline-offset-2 transition-colors"
          >
            Limpar tudo
          </button>
        </div>
      )}

      {/* Lista de profissionais */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-sora text-base lg:text-lg text-[#0b1c30] font-bold">Psicólogos do seu plano</h2>
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
                highlighted={specialties}
                profileHref={`/app/terapeutas/${therapist.id}`}
                actions={
                  isCurrent ? (
                    <>
                      <button
                        type="button"
                        disabled={doneThisWeek}
                        onClick={() => onSchedule(therapist, 'reschedule')}
                        className="flex-1 h-12 px-4 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold whitespace-nowrap flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:bg-[#cbc3d7] disabled:active:scale-100"
                      >
                        <span className="material-symbols-outlined text-[1.375rem]">
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
                      <Link
                        to={`/app/terapeutas/${therapist.id}`}
                        aria-label={`Ver perfil de ${therapist.name}`}
                        className="basis-full h-12 px-4 rounded-full border border-[#dce9ff] hover:bg-[#eff4ff] text-[#5516be] font-outfit text-sm font-semibold flex items-center justify-center active:scale-[0.98] transition-all"
                      >
                        Ver perfil
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onSchedule(therapist, 'choose')}
                        className="flex-1 h-12 px-4 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                      >
                        <span className="material-symbols-outlined text-[1.375rem]">calendar_add_on</span>
                        <span>Escolher</span>
                      </button>
                      <Link
                        to={`/app/terapeutas/${therapist.id}`}
                        aria-label={`Ver perfil de ${therapist.name}`}
                        className="h-12 px-4 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-outfit text-sm font-medium flex items-center justify-center active:scale-[0.98] transition-all shrink-0"
                      >
                        Ver perfil
                      </Link>
                    </>
                  )
                }
              />
            );
          })}
        </div>

        {filteredTherapists.length === 0 && (
          <div className="card !p-8 text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[2.5rem] text-[#7b7486]">search_off</span>
            <h3 className="font-sora text-base font-bold text-[#0b1c30]">Nenhum psicólogo encontrado</h3>
            <p className="text-sm text-[#494454] font-outfit">
              {hasFilters ? 'Tente outro termo ou remova algum filtro.' : 'Ainda não há profissionais disponíveis no seu plano.'}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 h-11 px-5 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be] text-sm font-outfit font-semibold transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </section>

      {/* Garantia de sigilo */}
      <aside className="bg-[#eff4ff] rounded-3xl p-5 flex flex-col gap-2 border border-[#dce9ff]">
        <div className="flex items-center gap-2 text-[#0b1c30] font-semibold font-outfit text-sm">
          <span className="material-symbols-outlined text-[1.375rem] text-[#6b38d4]">lock</span>
          <span>Privacidade e sigilo profissional</span>
        </div>
        <p className="font-outfit text-sm text-[#494454] leading-relaxed max-w-3xl">
          Os psicólogos seguem o sigilo previsto no Código de Ética do Conselho Federal de Psicologia (CFP).{' '}
          <strong>Sua empresa nunca saberá quando ou com quem você consulta.</strong>
        </p>
      </aside>
    </div>
  );
};
