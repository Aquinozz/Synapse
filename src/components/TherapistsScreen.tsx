import React, { useState } from 'react';
import { Therapist } from '../types';
import { INITIAL_THERAPISTS } from '../data/mockData';
import { sound } from '../utils/audio';

interface TherapistsScreenProps {
  onSchedule: (therapist: Therapist) => void;
  onViewProfile: (therapist: Therapist) => void;
  isDiscretionActive: boolean;
}

export const TherapistsScreen: React.FC<TherapistsScreenProps> = ({
  onSchedule,
  onViewProfile,
  isDiscretionActive,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filterTabs = [
    { id: 'all', label: 'Todos (42)', icon: 'all_inclusive' },
    { id: 'burnout', label: 'Burnout & Carreira (14)', icon: 'psychology_alt', color: 'text-[#6b38d4]' },
    { id: 'anxiety', label: 'Ansiedade & Estresse (22)', icon: 'self_improvement', color: 'text-[#0051d5]' },
    { id: 'tcc', label: 'TCC (Cognitiva)', icon: 'conversion_path', color: 'text-[#00855b]' },
    { id: 'today', label: 'Disponível Hoje', icon: 'schedule', color: 'text-[#8455ef]' },
    { id: 'women', label: 'Mulheres Psicólogas', icon: 'face_3', color: 'text-[#6b38d4]' },
  ];

  const filteredTherapists = INITIAL_THERAPISTS.filter((th) => {
    const matchesSearch =
      th.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      th.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      th.tags.some((t) => t.label.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'burnout') {
      return th.tags.some((t) => t.category === 'burnout');
    }
    if (selectedFilter === 'tcc') {
      return th.tags.some((t) => t.category === 'tcc');
    }
    if (selectedFilter === 'today') {
      return th.slots.some((s) => s.includes('Hoje'));
    }
    if (selectedFilter === 'women') {
      return th.name.startsWith('Dra.');
    }
    return true;
  });

  return (
    <div
      className={`flex flex-col w-full px-4 pb-28 pt-20 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto space-y-4 ${
        isDiscretionActive ? 'discretion-blur' : ''
      }`}
    >
      {/* Acolhimento & Benefício Corporativo */}
      <div className="relative overflow-hidden bg-[#e9ddff]/60 rounded-3xl p-4 sm:p-5 shadow-sm border border-[#6b38d4]/15">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#6b38d4] flex items-center justify-center text-white shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[22px]">verified_user</span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-sora text-base sm:text-lg text-[#23005c] font-bold tracking-tight">
                Cuidado Ilimitado
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#6ffbbe] text-[#002113] font-outfit text-[11px] font-semibold tracking-wide uppercase">
                Ativo
              </span>
            </div>
            <p className="font-outfit text-xs text-[#494454] mt-0.5 leading-snug">
              Seu benefício inclui{' '}
              <strong className="text-[#0b1c30] font-semibold">
                4 sessões mensais 100% subsidiadas
              </strong>{' '}
              pela sua empresa com total privacidade.
            </p>
          </div>
        </div>
        {/* Ambient micro-accent */}
        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[#8455ef]/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Barra de Busca Neural */}
      <div className="flex flex-col gap-1">
        <label className="sr-only" htmlFor="search-input">
          Buscar profissionais de saúde mental
        </label>
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7b7486]">
            <span className="material-symbols-outlined text-[22px]">search</span>
          </div>
          <input
            id="search-input"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por especialidade, abordagem ou nome..."
            className="w-full h-[52px] pl-11 pr-11 bg-white text-[#0b1c30] placeholder:text-[#7b7486] text-xs sm:text-sm font-outfit rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6b38d4]/30 border border-black/[0.04] transition-all"
          />
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-1.5 my-auto w-10 h-10 rounded-full flex items-center justify-center text-[#494454] hover:bg-[#eff4ff]"
            >
              <span className="material-symbols-outlined text-[18px]">clear</span>
            </button>
          ) : (
            <button
              aria-label="Filtros avançados"
              className="absolute inset-y-0 right-1.5 my-auto w-10 h-10 rounded-full flex items-center justify-center text-[#494454] hover:bg-[#eff4ff] active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtros Rápidos em Pills Horizontais */}
      <div className="flex flex-col gap-1 -mx-4 px-4 overflow-hidden">
        <div
          role="tablist"
          aria-label="Filtros por especialidade"
          className="flex items-center gap-2 overflow-x-auto pb-1 scroll-smooth"
        >
          {filterTabs.map((tab) => {
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedFilter(tab.id);
                  sound.playChime('click');
                }}
                className={`shrink-0 h-11 px-4 rounded-full font-outfit text-xs font-semibold shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform ${
                  isActive
                    ? 'bg-[#6b38d4] text-white shadow-md'
                    : 'bg-white text-[#494454] hover:text-[#0b1c30] border border-black/[0.04]'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    isActive ? 'text-white' : tab.color || 'text-[#494454]'
                  }`}
                >
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Profissionais Recomendados */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-sora text-base sm:text-lg text-[#0b1c30] font-bold">
              Especialistas Indicados
            </span>
            <span className="w-2 h-2 rounded-full bg-[#00855b]" />
          </div>
          <span className="font-outfit text-xs text-[#494454] font-medium">
            {filteredTherapists.length} disponíveis · Ordem de afinidade
          </span>
        </div>

        {/* CARD 1: Destaque Principal (Dra. Camila Rossi) */}
        {filteredTherapists.map((therapist) => {
          const isFeatured = therapist.id === 'camila';

          return (
            <article
              key={therapist.id}
              className={`bg-white rounded-3xl p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden transition-all duration-300 border ${
                isFeatured ? 'border-[#6b38d4]/20 shadow-md' : 'border-black/[0.04]'
              }`}
            >
              {/* Glow Decorativo de Recomendação */}
              {isFeatured && (
                <div className="absolute top-0 right-0 w-36 h-36 bg-[#e9ddff]/40 rounded-full blur-2xl pointer-events-none" />
              )}

              {/* Badge de recomendação corporativa */}
              {therapist.badge && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#dbe1ff]/60 text-[#003ea8] self-start">
                  <span className="material-symbols-outlined text-[15px] text-[#0051d5]">
                    thumb_up
                  </span>
                  <span className="font-outfit text-xs font-semibold tracking-wide">
                    {therapist.badge}
                  </span>
                </div>
              )}

              {/* Cabeçalho do Perfil */}
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <img
                    src={therapist.avatar}
                    alt={therapist.name}
                    className="w-18 h-18 sm:w-20 sm:h-20 w-[68px] h-[68px] rounded-full object-cover shadow-sm ring-4 ring-[#e9ddff]/30"
                  />
                  {therapist.isAvailableNow && (
                    <span
                      className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#00855b] ring-2 ring-white"
                      title="Disponível agora"
                    />
                  )}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <h2 className="font-sora text-base sm:text-lg text-[#0b1c30] font-bold leading-tight truncate">
                      {therapist.name}
                    </h2>
                    <div className="flex items-center gap-0.5 text-[#0b1c30] shrink-0">
                      <span className="material-symbols-outlined text-[16px] text-amber-500 fill-1">
                        star
                      </span>
                      <span className="font-outfit text-xs font-bold">{therapist.rating}</span>
                      <span className="font-outfit text-xs text-[#494454]">
                        ({therapist.reviewCount})
                      </span>
                    </div>
                  </div>

                  <span className="font-outfit text-xs text-[#6b38d4] font-semibold tracking-wide mt-0.5">
                    {therapist.reg} • {therapist.title}
                  </span>

                  <p className="font-outfit text-xs text-[#494454] line-clamp-2 mt-1">
                    {therapist.bio}
                  </p>
                </div>
              </div>

              {/* Especialidades / Tags */}
              <div className="flex flex-wrap gap-1.5">
                {therapist.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#0b1c30] font-outfit text-xs font-medium"
                  >
                    <span className="material-symbols-outlined text-[14px] text-[#6b38d4]">
                      {tag.icon}
                    </span>
                    <span>{tag.label}</span>
                  </span>
                ))}
              </div>

              {/* Próxima disponibilidade */}
              <div className="flex items-center justify-between bg-[#eff4ff] p-2.5 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#006947] font-semibold">
                    event_available
                  </span>
                  <span className="font-outfit text-xs text-[#0b1c30] font-medium">
                    Próximas vagas:
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {therapist.slots.slice(0, 2).map((s, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded-full font-outfit text-[11px] font-semibold ${
                        idx === 0
                          ? 'bg-white text-[#0b1c30] shadow-xs'
                          : 'bg-white/70 text-[#494454]'
                      }`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ações (Ergonomia 48px Touch) */}
              <div className="flex flex-col xs:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSchedule(therapist)}
                  className="flex-1 h-12 px-5 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
                  <span>Agendar Sessão Gratuita</span>
                </button>

                <button
                  type="button"
                  onClick={() => onViewProfile(therapist)}
                  className="h-12 px-4 rounded-full bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] font-outfit text-xs sm:text-sm font-medium flex items-center justify-center gap-1 active:scale-[0.98] transition-all"
                >
                  <span>Ver Perfil</span>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </article>
          );
        })}

        {filteredTherapists.length === 0 && (
          <div className="bg-white rounded-3xl p-8 text-center flex flex-col items-center gap-2 border border-[#e5eeff]">
            <span className="material-symbols-outlined text-[32px] text-[#7b7486]">search_off</span>
            <h4 className="font-sora text-sm font-bold text-[#0b1c30]">
              Nenhum especialista encontrado
            </h4>
            <p className="text-xs text-[#494454] font-outfit">
              Tente redefinir os filtros ou buscar por outro termo clínico.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedFilter('all');
              }}
              className="mt-2 px-4 py-2 rounded-full bg-[#eff4ff] text-[#6b38d4] text-xs font-outfit font-semibold"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Box de Garantia de Confidencialidade e Sigilo Médico */}
      <aside className="bg-[#eff4ff] rounded-3xl p-5 flex flex-col gap-2 shadow-xs border border-[#dce9ff]">
        <div className="flex items-center gap-2 text-[#0b1c30] font-semibold font-outfit text-xs sm:text-sm">
          <span className="material-symbols-outlined text-[20px] text-[#6b38d4]">lock_reset</span>
          <span>Privacidade & Sigilo Ético Inviolável</span>
        </div>
        <p className="font-outfit text-xs text-[#494454] leading-relaxed">
          Sessões realizadas via teleconsulta criptografada de ponta a ponta com prontuário sob sigilo ético absoluto do Conselho Federal de Psicologia (CFP).{' '}
          <strong>Sua empresa nunca saberá quando ou com quem você consulta.</strong>
        </p>
        <div className="flex items-center gap-3 pt-1 text-[#7b7486] font-outfit text-[11px] flex-wrap">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#006947]">
              check_circle
            </span>
            Certificado CFP & CFM
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#006947]">
              check_circle
            </span>
            ISO 27001 Dados Médicos
          </span>
        </div>
      </aside>
    </div>
  );
};
