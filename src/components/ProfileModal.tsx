import React from 'react';
import { IMAGES } from '../constants/images';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleDiscretion: () => void;
  isDiscretionActive: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onToggleDiscretion,
  isDiscretionActive,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1c30]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#ffffff] w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col relative max-h-[85vh] overflow-y-auto border border-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#494454] hover:text-[#0b1c30]"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Profile Details */}
        <div className="flex flex-col items-center text-center pb-4 border-b border-[#eff4ff]">
          <div className="relative mb-2">
            <img
              src={IMAGES.userMarina}
              alt="Marina"
              className="w-16 h-16 rounded-full object-cover shadow-md ring-4 ring-[#e9ddff]"
            />
            <span
              className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#00855b] ring-2 ring-white"
              title="Equilibrado"
            />
          </div>
          <h3 className="font-sora text-base font-bold text-[#0b1c30]">Marina Silva</h3>
          <span className="text-xs text-[#6b38d4] font-outfit font-semibold">
            Tech Lead • Engenharia de Software
          </span>
          <span className="text-[11px] text-[#494454] font-outfit mt-0.5">
            Benefício Corporativo Ativo (3/4 sessões restantes)
          </span>
        </div>

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
              <span className="px-1.5 py-0.2 rounded-full bg-[#6ffbbe] text-[#002113] text-[9px] font-bold uppercase">
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
              onClick={onToggleDiscretion}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isDiscretionActive
                  ? 'bg-[#00855b] text-white'
                  : 'bg-[#6b38d4] text-white hover:bg-[#8455ef]'
              }`}
            >
              {isDiscretionActive ? 'Desativar' : 'Ativar'}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full h-11 mt-2 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-outfit text-xs font-bold transition-colors"
        >
          Concluir
        </button>
      </div>
    </div>
  );
};
