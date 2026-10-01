import React from 'react';
import { Link } from 'react-router';
import { Therapist } from '../types';
import { WEEKDAYS_SHORT } from '../utils/schedule';
import { Avatar } from './Avatar';

interface TherapistCardProps {
  therapist: Therapist;
  /** Highlights the card as the employee's fixed therapist */
  isCurrent?: boolean;
  /** Line under the name of the current therapist, e.g. "Toda quarta, 16:30" */
  currentLabel?: string;
  /** Specialties the person is filtering by: shown first and emphasised */
  highlighted?: string[];
  /** The psychologist's own page; photo and name link to it. Omitted in the read-only preview */
  profileHref?: string;
  /** Action row; omitted in the read-only preview shown to the psychologist */
  actions?: React.ReactNode;
}

/**
 * How a psychologist appears to employees in the directory.
 * Lays out as a wide row when the card itself has room (container query),
 * and stacks in narrow places such as phones or the profile preview.
 */
export const TherapistCard: React.FC<TherapistCardProps> = ({
  therapist,
  isCurrent,
  currentLabel,
  highlighted = [],
  profileHref,
  actions,
}) => (
  <article
    className={`@container card transition-shadow hover:shadow-md ${
      isCurrent ? '!border-[#6b38d4]/40 !bg-[#fbf9ff]' : ''
    }`}
  >
    <div className="flex flex-col @3xl:flex-row gap-3 @3xl:gap-6">
      {/* Quem é */}
      <div className="flex items-start gap-3 @3xl:gap-5 flex-1 min-w-0">
        {profileHref ? (
          // The name right beside it is the link people tab to; this one is for the pointer
          <Link to={profileHref} tabIndex={-1} aria-hidden="true" className="shrink-0 rounded-2xl hover:opacity-90 transition-opacity">
            <Avatar name={therapist.name} image={therapist.avatar} className={AVATAR_SIZE} />
          </Link>
        ) : (
          <Avatar name={therapist.name} image={therapist.avatar} className={AVATAR_SIZE} />
        )}

        <div className="flex flex-col gap-2 @3xl:gap-2.5 min-w-0 flex-1">
          <div className="flex flex-col">
            <h3 className="font-sora text-base @3xl:text-xl text-[#0b1c30] font-bold leading-tight">
              {profileHref ? (
                <Link to={profileHref} className="rounded hover:text-[#6b38d4] hover:underline underline-offset-4 transition-colors">
                  {therapist.name}
                </Link>
              ) : (
                therapist.name
              )}
            </h3>
            <span className="font-outfit text-xs @3xl:text-sm text-[#494454] mt-0.5">{therapist.title}</span>
            <div className="flex items-center gap-x-3 gap-y-1 mt-1 font-outfit text-xs @3xl:text-sm text-[#494454] flex-wrap">
              <span className="flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[1.0625rem] text-amber-500 fill-1">star</span>
                {therapist.reviewCount > 0 ? (
                  <>
                    <strong className="text-[#0b1c30]">{therapist.rating.toFixed(1)}</strong>
                    <span>({therapist.reviewCount})</span>
                  </>
                ) : (
                  <span>Novo no Synapse</span>
                )}
              </span>
              <span className="flex items-center gap-0.5 text-[#003ea8]">
                <span className="material-symbols-outlined text-[1rem]">verified</span>
                {therapist.reg}
              </span>
            </div>
          </div>

          {/* On a narrow card the rest spans the full width, below the photo */}
          <div className="hidden @3xl:flex flex-col gap-2.5">
            <CardDetails therapist={therapist} isCurrent={isCurrent} currentLabel={currentLabel} highlighted={highlighted} />
          </div>
        </div>
      </div>

      <div className="flex @3xl:hidden flex-col gap-3">
        <CardDetails therapist={therapist} isCurrent={isCurrent} currentLabel={currentLabel} highlighted={highlighted} />
      </div>

      {/* Horários e ações */}
      <div className="flex flex-col gap-3 @3xl:w-72 @3xl:shrink-0 @3xl:justify-between @3xl:border-l @3xl:border-[#e5eeff] @3xl:pl-6">
        <div className="flex flex-col gap-1.5">
          <span className="font-outfit text-xs text-[#494454] font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[1.125rem] text-[#006947]">event_available</span>
            Horários semanais livres
          </span>
          <div className="flex flex-wrap gap-1.5">
            {therapist.weeklyAvailability.length === 0 && (
              <span className="font-outfit text-xs text-[#7b7486]">Sem horários livres no momento</span>
            )}
            {therapist.weeklyAvailability.map(({ weekday, times }) => (
              <span
                key={weekday}
                className="px-2.5 py-1 rounded-lg font-outfit text-xs font-semibold border bg-white text-[#494454] border-[#e5eeff] tabular-nums"
              >
                <span className="text-[#005236]">{WEEKDAYS_SHORT[weekday]}</span> {times.join(' · ')}
              </span>
            ))}
          </div>
        </div>

        {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  </article>
);

const AVATAR_SIZE = '!rounded-2xl w-16 h-16 @3xl:w-28 @3xl:h-28 text-lg @3xl:text-3xl';

/** How many specialties a card lists before folding the rest into "+N" */
const MAX_SPECIALTIES_SHOWN = 8;

/** Badge, presentation, specialties, approach and languages */
const CardDetails: React.FC<Pick<TherapistCardProps, 'therapist' | 'isCurrent' | 'currentLabel' | 'highlighted'>> = ({
  therapist,
  isCurrent,
  currentLabel,
  highlighted = [],
}) => {
  // The ones being filtered by come first, so a match is never hidden behind "+N"
  const ordered = [
    ...therapist.specialties.filter((s) => highlighted.includes(s)),
    ...therapist.specialties.filter((s) => !highlighted.includes(s)),
  ];
  const shown = ordered.slice(0, MAX_SPECIALTIES_SHOWN);
  const hidden = ordered.length - shown.length;

  return (
  <>
    {isCurrent ? (
      <div className="self-start flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#6b38d4] text-white font-outfit text-xs font-semibold">
        <span className="material-symbols-outlined text-[1.0625rem] fill-1">favorite</span>
        <span>Seu psicólogo{currentLabel ? ` · ${currentLabel}` : ''}</span>
      </div>
    ) : (
      therapist.badge && (
        <div className="self-start flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#e9ddff]/50 text-[#5516be] font-outfit text-xs font-semibold">
          <span className="material-symbols-outlined text-[1.0625rem]">thumb_up</span>
          <span>{therapist.badge}</span>
        </div>
      )
    )}

    {therapist.bio && (
      <p className="font-outfit text-sm text-[#494454] leading-relaxed">{therapist.bio}</p>
    )}

    {shown.length > 0 && (
      <ul aria-label="Especialidades" className="flex flex-wrap gap-1.5">
        {shown.map((specialty) => (
          <li
            key={specialty}
            className={`px-2.5 py-1 rounded-full font-outfit text-xs font-medium ${
              highlighted.includes(specialty) ? 'bg-[#6b38d4] text-white' : 'bg-[#e9ddff]/60 text-[#23005c]'
            }`}
          >
            {specialty}
          </li>
        ))}
        {hidden > 0 && (
          <li className="px-2.5 py-1 rounded-full font-outfit text-xs font-medium text-[#494454] bg-[#eff4ff]">
            +{hidden}
          </li>
        )}
      </ul>
    )}

    <dl className="flex flex-col gap-1 font-outfit text-sm text-[#494454]">
      {therapist.approaches.length > 0 && (
        <div className="flex flex-wrap gap-x-1.5">
          <dt className="font-semibold text-[#0b1c30] shrink-0">Abordagem:</dt>
          <dd className="min-w-0 break-words">{therapist.approaches.join(', ')}</dd>
        </div>
      )}
      {therapist.languages.length > 0 && (
        <div className="flex flex-wrap gap-x-1.5">
          <dt className="font-semibold text-[#0b1c30] shrink-0">Atende em:</dt>
          <dd className="min-w-0 break-words">{therapist.languages.join(', ')}</dd>
        </div>
      )}
    </dl>
  </>
  );
};
