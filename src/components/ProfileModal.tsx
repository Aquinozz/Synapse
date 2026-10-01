import React from 'react';
import { useSession } from '../auth/session';
import { Avatar } from './Avatar';
import { Modal, ModalCloseButton } from './Modal';
import { useEmployeePlan } from '../areas/employee/plan';
import { formatRecurring } from '../utils/schedule';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleDiscretion: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onToggleDiscretion,
  onLogout,
}) => {
  const { plan, therapist } = useEmployeePlan();
  const { session } = useSession();
  const name = session?.name ?? '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} label={`Perfil de ${name}`} maxWidth="max-w-sm">
        <ModalCloseButton onClose={onClose} className="absolute top-4 right-4" />

        {/* Profile Details */}
        <div className="flex flex-col items-center text-center pb-4 border-b border-[#eff4ff]">
          <Avatar name={name} className="w-16 h-16 text-xl mb-2" />
          <h3 className="font-sora text-base font-bold text-[#0b1c30]">{name}</h3>
          <span className="text-xs text-[#494454] font-outfit">{session?.email}</span>
          {session?.companyName && (
            <span className="text-xs text-[#6b38d4] font-outfit font-semibold mt-0.5">
              Plano pago por {session.companyName} · 1 sessão por semana
            </span>
          )}
        </div>

        {/* Weekly session */}
        {plan && therapist && (
        <div className="mt-3 p-3 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff] flex items-center gap-3">
          <Avatar name={therapist.name} image={therapist.avatar} />
          <div className="flex flex-col min-w-0 font-outfit">
            <span className="text-xs text-[#494454]">Seu psicólogo</span>
            <span className="text-sm font-semibold text-[#0b1c30] truncate">{therapist.name}</span>
            <span className="text-xs text-[#6b38d4] font-semibold">
              {formatRecurring(plan.weekday, plan.time)}
            </span>
          </div>
        </div>
        )}

        {/* Privacy & Governance Status */}
        <div className="my-3 space-y-2 text-xs font-outfit text-[#494454]">
          <div className="font-sora text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
            Blindagem de Privacidade
          </div>

          <div className="p-3 bg-[#eff4ff] rounded-2xl space-y-1.5 border border-[#dce9ff]">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-[#0051d5] font-semibold">
                <span className="material-symbols-outlined text-[16px]">enhanced_encryption</span>
                Anonimato LGPD
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#6ffbbe] text-[#002113] text-[9px] font-bold uppercase">
                Ativo
              </span>
            </div>
            <p className="text-[11px] text-[#494454] leading-snug">
              Nenhuma métrica individual ou agendamento é compartilhado com a diretoria ou RH da sua empresa.
            </p>
          </div>

          {/* Quick Discretion Mode */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff]">
            <div className="flex flex-col">
              <span className="font-bold text-[#0b1c30]">Discretion Shade</span>
              <span className="text-[11px] text-[#494454]">
                Desfoque instantâneo contra olhares curiosos
              </span>
            </div>
            <button
              onClick={() => {
                // The shade covers the whole app, so the profile sheet gets out of the way
                onToggleDiscretion();
                onClose();
              }}
              className="px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 bg-[#6b38d4] text-white hover:bg-[#8455ef]"
            >
              Ativar
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full h-11 mt-2 shrink-0 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-outfit text-sm font-bold transition-colors"
        >
          Concluir
        </button>
        <button
          onClick={onLogout}
          className="w-full h-11 mt-1 shrink-0 rounded-full text-[#ba1a1a] hover:bg-[#ffdad6]/50 font-outfit text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Sair
        </button>
    </Modal>
  );
};
