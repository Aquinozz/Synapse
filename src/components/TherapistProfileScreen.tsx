import React from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Therapist } from '../types';
import { WEEKDAYS, formatRecurring } from '../utils/schedule';
import { useEmployeePlan } from '../areas/employee/plan';
import { Avatar } from './Avatar';
import { ScheduleMode } from './ScheduleModal';
import { TherapistReviews } from './TherapistReviews';

interface TherapistProfileScreenProps {
  onSchedule: (therapist: Therapist, mode?: ScheduleMode) => void;
  /** Opens the conversation with the employee's own psychologist */
  onOpenChat: () => void;
}

const DIRECTORY = '/app/terapeutas';

/** The page of one psychologist: who they are, what they work with and their free weekly slots */
export const TherapistProfileScreen: React.FC<TherapistProfileScreenProps> = ({ onSchedule, onOpenChat }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, therapist: myTherapist, therapists, doneThisWeek, refreshTherapists } = useEmployeePlan();

  const therapist = therapists.find((th) => String(th.id) === id);

  // Going back keeps the filters of the directory; a page opened by its address has nowhere to go back to
  const goBack = () => (location.key === 'default' ? navigate(DIRECTORY) : navigate(-1));

  if (!therapist) {
    return (
      <div className="screen">
        <div className="card !p-8 text-center flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[2.5rem] text-[#7b7486]">search_off</span>
          <h1 className="font-sora text-base font-bold text-[#0b1c30]">Psicólogo não encontrado</h1>
          <p className="text-sm text-[#494454] font-outfit">
            Este perfil não está mais disponível no seu plano.
          </p>
          <Link
            to={DIRECTORY}
            className="mt-2 h-11 px-5 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be] text-sm font-outfit font-semibold transition-colors flex items-center"
          >
            Ver todos os psicólogos
          </Link>
        </div>
      </div>
    );
  }

  const isCurrent = therapist.id === myTherapist?.id;
  const firstName = therapist.name.split(' ').slice(0, 2).join(' ');
  const hasSlots = therapist.weeklyAvailability.length > 0;

  return (
    <div className="screen">
      <button
        type="button"
        onClick={goBack}
        className="self-start h-11 -ml-2 pl-2 pr-4 rounded-full text-[#494454] hover:bg-[#eff4ff] font-outfit text-sm font-semibold flex items-center gap-1.5 transition-colors"
      >
        <span className="material-symbols-outlined text-[1.375rem]">arrow_back</span>
        Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-start">
        {/* Quem é */}
        <section className="card lg:col-span-2 flex flex-col sm:flex-row gap-4 sm:gap-6">
          <Avatar
            name={therapist.name}
            image={therapist.avatar}
            className="!rounded-3xl w-24 h-24 sm:w-36 sm:h-36 text-3xl sm:text-5xl"
          />
          <div className="flex flex-col gap-2.5 min-w-0 flex-1">
            <div className="flex flex-col">
              <h1 className="font-sora text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight leading-tight">
                {therapist.name}
              </h1>
              <span className="font-outfit text-sm lg:text-base text-[#494454] mt-0.5">{therapist.title}</span>
            </div>

            <div className="flex items-center gap-x-4 gap-y-1 font-outfit text-sm text-[#494454] flex-wrap">
              <span className="flex items-center gap-1 text-[#003ea8] font-semibold">
                <span className="material-symbols-outlined text-[1.25rem]">verified</span>
                {therapist.reg} verificado
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[1.25rem] text-amber-500 fill-1">star</span>
                {therapist.reviewCount > 0 ? (
                  <>
                    <strong className="text-[#0b1c30]">{therapist.rating.toFixed(1)}</strong>
                    <span>
                      ({therapist.reviewCount} {therapist.reviewCount === 1 ? 'avaliação' : 'avaliações'})
                    </span>
                  </>
                ) : (
                  <span>Novo no Synapse</span>
                )}
              </span>
            </div>

            {isCurrent ? (
              <div className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6b38d4] text-white font-outfit text-sm font-semibold">
                <span className="material-symbols-outlined text-[1.25rem] fill-1">favorite</span>
                <span>Seu psicólogo{plan ? ` · ${formatRecurring(plan.weekday, plan.time)}` : ''}</span>
              </div>
            ) : (
              therapist.badge && (
                <div className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e9ddff]/50 text-[#5516be] font-outfit text-sm font-semibold">
                  <span className="material-symbols-outlined text-[1.25rem]">thumb_up</span>
                  <span>{therapist.badge}</span>
                </div>
              )
            )}
          </div>
        </section>

        {/* Horários e ações: logo abaixo do nome no celular, ao lado no computador */}
        <aside className="card lg:row-span-3 lg:sticky lg:top-24 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <h2 className="font-sora text-base font-bold text-[#0b1c30] flex items-center gap-2">
              <span className="material-symbols-outlined text-[1.375rem] text-[#006947]">event_available</span>
              Horários semanais livres
            </h2>
            {hasSlots ? (
              <ul className="flex flex-col gap-2.5">
                {therapist.weeklyAvailability.map(({ weekday, times }) => (
                  <li key={weekday} className="flex gap-3">
                    <span className="font-outfit text-sm font-semibold text-[#005236] min-w-18 shrink-0 pt-1">
                      {WEEKDAYS[weekday]}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {times.map((time) => (
                        <span
                          key={time}
                          className="px-2.5 py-1 rounded-lg font-outfit text-sm font-semibold border bg-white text-[#494454] border-[#e5eeff] tabular-nums"
                        >
                          {time}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-outfit text-sm text-[#7b7486]">Sem horários livres no momento.</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {isCurrent ? (
              <>
                <button
                  type="button"
                  disabled={doneThisWeek}
                  onClick={() => onSchedule(therapist, 'reschedule')}
                  className="min-h-12 px-4 py-1.5 leading-tight rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:bg-[#cbc3d7] disabled:active:scale-100"
                >
                  <span className="material-symbols-outlined text-[1.375rem]">
                    {doneThisWeek ? 'check' : 'event_repeat'}
                  </span>
                  <span>{doneThisWeek ? 'Semana realizada' : 'Remarcar a semana'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSchedule(therapist, 'choose')}
                  className="min-h-12 px-4 py-1.5 leading-tight rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-outfit text-sm font-medium flex items-center justify-center active:scale-[0.98] transition-all"
                >
                  Mudar horário fixo
                </button>
                <button
                  type="button"
                  onClick={onOpenChat}
                  className="min-h-12 px-4 py-1.5 leading-tight rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be] font-outfit text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-[1.25rem]">chat</span>
                  Enviar mensagem
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={!hasSlots}
                onClick={() => onSchedule(therapist, 'choose')}
                className="min-h-12 px-4 py-1.5 leading-tight rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:bg-[#cbc3d7] disabled:active:scale-100"
              >
                <span className="material-symbols-outlined text-[1.375rem]">calendar_add_on</span>
                <span>Escolher {firstName}</span>
              </button>
            )}
          </div>

          <p className="p-3 rounded-2xl bg-[#dbe1ff]/50 font-outfit text-sm text-[#00174b] leading-snug flex items-start gap-2">
            <span className="material-symbols-outlined text-[1.25rem] text-[#0051d5] shrink-0">verified</span>
            <span>
              <strong>Coberto pelo seu plano:</strong> 1 sessão por semana, paga pela sua empresa. Ela nunca sabe quando
              ou com quem você consulta.
            </span>
          </p>
        </aside>

        {/* O que atende */}
        <section className="card lg:col-span-2 flex flex-col gap-6">
          {therapist.bio && (
            <div className="flex flex-col gap-2">
              <h2 className="font-sora text-base font-bold text-[#0b1c30]">Sobre</h2>
              <p className="font-outfit text-base text-[#494454] leading-relaxed">{therapist.bio}</p>
            </div>
          )}

          {therapist.specialties.length > 0 && (
            <ProfileList title="Especialidades" items={therapist.specialties} />
          )}
          {therapist.approaches.length > 0 && (
            <ProfileList title={therapist.approaches.length === 1 ? 'Abordagem' : 'Abordagens'} items={therapist.approaches} tone="blue" />
          )}
          {therapist.languages.length > 0 && (
            <ProfileList title="Atende em" items={therapist.languages} tone="neutral" />
          )}
        </section>

        <div className="lg:col-span-2">
          <TherapistReviews
            key={therapist.id}
            therapistId={therapist.id}
            therapistName={firstName}
            // The rating shown in the header and in the directory follows the reviews
            onChanged={() => refreshTherapists().catch(() => {})}
          />
        </div>
      </div>
    </div>
  );
};

const TONES = {
  purple: 'bg-[#e9ddff]/60 text-[#23005c]',
  blue: 'bg-[#dbe1ff]/60 text-[#00174b]',
  neutral: 'bg-[#eff4ff] text-[#494454]',
};

const ProfileList: React.FC<{ title: string; items: string[]; tone?: keyof typeof TONES }> = ({
  title,
  items,
  tone = 'purple',
}) => (
  <div className="flex flex-col gap-2">
    <h2 className="font-sora text-base font-bold text-[#0b1c30]">{title}</h2>
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className={`px-3.5 py-1.5 rounded-full font-outfit text-sm font-medium ${TONES[tone]}`}>
          {item}
        </li>
      ))}
    </ul>
  </div>
);
