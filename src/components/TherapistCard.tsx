import React from 'react';
import { Therapist } from '../types';
import { WEEKDAYS_SHORT } from '../utils/schedule';
import { Avatar } from './Avatar';

interface TherapistCardProps {
  therapist: Therapist;
  /** Highlights the card as the employee's fixed therapist */
  isCurrent?: boolean;
  /** Line under the name of the current therapist, e.g. "Toda quarta, 16:30" */
  currentLabel?: string;
  /** Action row; omitted in the read-only preview shown to the psychologist */
  actions?: React.ReactNode;
}

/**
 * How a psychologist appears to employees in the directory.
 * Lays out as a wide row when the card itself has room (container query),
 * and stacks in narrow places such as phones or the profile preview.
 */
export const TherapistCard: React.FC<TherapistCardProps> = ({ therapist, isCurrent, currentLabel, actions }) => (
  <article
    className={`@container card transition-shadow hover:shadow-md ${
      isCurrent ? '!border-[#6b38d4]/40 !bg-[#fbf9ff]' : ''
    }`}
  >
    <div className="flex flex-col @3xl:flex-row gap-3 @3xl:gap-6">
      {/* Quem é */}
      <div className="flex items-start gap-3 @3xl:gap-5 flex-1 min-w-0">
        <Avatar
          name={therapist.name}
          image={therapist.avatar}
          className="!rounded-2xl w-16 h-16 @3xl:w-28 @3xl:h-28 text-lg @3xl:text-3xl"
        />

        <div className="flex flex-col gap-2 @3xl:gap-2.5 min-w-0 flex-1">
          <div className="flex flex-col">
            <h3 className="font-sora text-base @3xl:text-xl text-[#0b1c30] font-bold leading-tight">
              {therapist.name}
            </h3>
            <span className="font-outfit text-xs @3xl:text-sm text-[#494454] mt-0.5">{therapist.title}</span>
            <div className="flex items-center gap-x-3 gap-y-1 mt-1 font-outfit text-xs @3xl:text-sm text-[#494454] flex-wrap">
              <span className="flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[15px] text-amber-500 fill-1">star</span>
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
                <span className="material-symbols-outlined text-[14px]">verified</span>
                {therapist.reg}
              </span>
            </div>
          </div>

          {/* On a narrow card the rest spans the full width, below the photo */}
          <div className="hidden @3xl:flex flex-col gap-2.5">
            <CardDetails therapist={therapist} isCurrent={isCurrent} currentLabel={currentLabel} />
          </div>
        </div>
      </div>

      <div className="flex @3xl:hidden flex-col gap-3">
        <CardDetails therapist={therapist} isCurrent={isCurrent} currentLabel={currentLabel} />
      </div>

      {/* Horários e ações */}
      <div className="flex flex-col gap-3 @3xl:w-72 @3xl:shrink-0 @3xl:justify-between @3xl:border-l @3xl:border-[#e5eeff] @3xl:pl-6">
        <div className="flex flex-col gap-1.5">
          <span className="font-outfit text-xs text-[#494454] font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-[#006947]">event_available</span>
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

/** Badge, presentation and specialties */
const CardDetails: React.FC<Pick<TherapistCardProps, 'therapist' | 'isCurrent' | 'currentLabel'>> = ({
  therapist,
  isCurrent,
  currentLabel,
}) => (
  <>
    {isCurrent ? (
      <div className="self-start flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#6b38d4] text-white font-outfit text-xs font-semibold">
        <span className="material-symbols-outlined text-[15px] fill-1">favorite</span>
        <span>Seu psicólogo{currentLabel ? ` · ${currentLabel}` : ''}</span>
      </div>
    ) : (
      therapist.badge && (
        <div className="self-start flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#e9ddff]/50 text-[#5516be] font-outfit text-xs font-semibold">
          <span className="material-symbols-outlined text-[15px]">thumb_up</span>
          <span>{therapist.badge}</span>
        </div>
      )
    )}

    {therapist.bio && (
      <p className="font-outfit text-sm text-[#494454] leading-relaxed">{therapist.bio}</p>
    )}

    <div className="flex flex-wrap gap-1.5">
      {therapist.tags.map((tag) => (
        <span
          key={tag.label}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#0b1c30] font-outfit text-xs font-medium"
        >
          <span className="material-symbols-outlined text-[14px] text-[#6b38d4]">{tag.icon}</span>
          <span>{tag.label}</span>
        </span>
      ))}
    </div>
  </>
);
