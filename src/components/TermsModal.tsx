import React from 'react';
import { TermsContent } from '../legal/terms';
import { Modal, ModalCloseButton } from './Modal';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** The terms of acceptance, for reading at any time */
export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} label="Termo de Aceite e Privacidade" maxWidth="max-w-2xl" className="gap-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <span className="font-outfit text-xs font-bold uppercase tracking-wider text-[#6b38d4]">LGPD</span>
        <h2 className="font-sora text-lg font-bold text-[#0b1c30]">Termo de Aceite e Privacidade</h2>
      </div>
      <ModalCloseButton onClose={onClose} />
    </div>

    <TermsContent />

    <button
      onClick={onClose}
      className="h-12 shrink-0 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-bold transition-colors"
    >
      Fechar
    </button>
  </Modal>
);
