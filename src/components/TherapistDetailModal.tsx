import React from 'react';
import { Avatar } from './Avatar';
import { Therapist } from '../types';
import { Modal, ModalCloseButton } from './Modal';

interface TherapistDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapist: Therapist | null;
  /** The therapist shown is already the employee's fixed one */
  isCurrent?: boolean;
  onSchedule: (therapist: Therapist) => void;
}

export const TherapistDetailModal: React.FC<TherapistDetailModalProps> = ({
  isOpen,
  onClose,
  therapist,
  isCurrent = false,
  onSchedule,
}) => {
  if (!therapist) return null;

  const firstName = therapist.name.split(' ').slice(0, 2).join(' ');
  const isFemale = therapist.name.startsWith('Dra.');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      label={`Perfil de ${therapist.name}`}
      maxWidth="max-w-lg"
    >
        <ModalCloseButton onClose={onClose} className="absolute top-4 right-4 z-10" />

        {/* Profile Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-[#eff4ff]">
          <div className="relative shrink-0">
            <Avatar name={therapist.name} image={therapist.avatar} className="w-20 h-20 text-2xl ring-4 ring-[#e9ddff]" />
          </div>
          <div className="flex flex-col min-w-0 flex-1 pr-10">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-sora text-lg font-bold text-[#0b1c30]">
                {therapist.name}
              </h3>
            </div>
            <span className="font-outfit text-xs text-[#6b38d4] font-semibold">
              {therapist.reg} · {therapist.title}
            </span>
            <div className="flex items-center gap-1 mt-1 text-xs text-[#0b1c30]">
              <span className="material-symbols-outlined text-[15px] text-amber-500 fill-1">star</span>
              {therapist.reviewCount > 0 ? (
                <>
                  <strong className="font-sora">{therapist.rating.toFixed(1)}</strong>
                  <span className="text-[#494454]">({therapist.reviewCount} avaliações)</span>
                </>
              ) : (
                <span className="text-[#494454]">Novo no Synapse</span>
              )}
            </div>
          </div>
        </div>

        {/* Corporate Subsidy Badge */}
        <div className="my-3 p-3 rounded-2xl bg-[#dbe1ff]/50 flex items-center gap-2 text-xs text-[#00174b]">
          <span className="material-symbols-outlined text-[18px] text-[#0051d5]">verified</span>
          <span>
            <strong>Coberto pelo seu plano:</strong> 1 sessão por semana com {firstName}, paga pela sua empresa.
          </span>
        </div>

        {/* Bio */}
        <div className="my-2">
          <h4 className="font-sora text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-1">
            Sobre {isFemale ? 'a' : 'o'} Especialista
          </h4>
          <p className="font-outfit text-sm text-[#494454] leading-relaxed">
            {therapist.bio} Com mais de 10 anos de experiência clínica, desenvolve abordagens estruturadas focadas em saúde mental no ambiente corporativo de tecnologia, transições de carreira e prevenção de esgotamento.
          </p>
        </div>

        {/* Tags */}
        <div className="my-2">
          <h4 className="font-sora text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-2">
            Especialidades Clínicas
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {therapist.tags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#eff4ff] text-[#0b1c30] text-xs font-medium font-outfit"
              >
                <span className="material-symbols-outlined text-[14px] text-[#6b38d4]">
                  {tag.icon}
                </span>
                <span>{tag.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Patient Review Sample */}
        <div className="my-3 p-3 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-[#0b1c30]">Avaliação Anônima de Colaborador</span>
            <span className="text-[#00855b] flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px] fill-1">star</span> 5.0
            </span>
          </div>
          <p className="font-outfit text-xs text-[#494454] italic">
            "A abordagem foi extremamente acolhedora e pragmática. Me ajudou a redefinir limites claros de horários sem culpa."
          </p>
        </div>

        {/* CTA */}
        <div className="pt-2 flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSchedule(therapist)}
            className="flex-1 h-12 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
            <span>{isCurrent ? 'Mudar horário fixo' : `Escolher ${firstName}`}</span>
          </button>
        </div>
    </Modal>
  );
};
