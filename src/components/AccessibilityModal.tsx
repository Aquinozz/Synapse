import React from 'react';
import { COLOR_VISION_MODES } from '../accessibility/colorVision';
import { TEXT_SIZES, useAccessibility } from '../accessibility/preferences';
import { isSpeechSupported, useHasVoices } from '../accessibility/speech';
import { Modal, ModalCloseButton } from './Modal';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// The letter of each text-size option is drawn at a growing size, so the choice explains itself
const SAMPLE_SIZE = { normal: 'text-base', large: 'text-xl', larger: 'text-2xl' } as const;

const OPTION_CLASS =
  'rounded-2xl border cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#6b38d4] has-[:focus-visible]:ring-offset-2';
const selectedClass = (isSelected: boolean) =>
  isSelected ? 'bg-[#e9ddff]/50 border-[#6b38d4]/60' : 'bg-white border-[#e5eeff] hover:border-[#6b38d4]/30';

/** Text size, read-aloud and colour correction. Native inputs: keyboard works, and a choice applies at once. */
export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ isOpen, onClose }) => {
  const { colorVision, setColorVision, textSize, setTextSize, readAloud, setReadAloud } = useAccessibility();
  const canSpeak = isSpeechSupported();
  const hasVoices = useHasVoices();

  return (
    <Modal isOpen={isOpen} onClose={onClose} label="Acessibilidade" maxWidth="max-w-md" className="gap-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-sora text-lg font-bold text-[#0b1c30]">Acessibilidade</h3>
        <ModalCloseButton onClose={onClose} />
      </div>

      <fieldset>
        <legend className="font-outfit text-sm font-semibold text-[#0b1c30] mb-2">Tamanho das letras</legend>
        <div className="grid grid-cols-3 gap-2">
          {TEXT_SIZES.map((option) => {
            const isSelected = textSize === option.id;
            return (
              <label
                key={option.id}
                className={`h-20 flex flex-col items-center justify-center gap-0.5 ${OPTION_CLASS} ${selectedClass(isSelected)}`}
              >
                <input
                  type="radio"
                  name="text-size"
                  value={option.id}
                  checked={isSelected}
                  onChange={() => setTextSize(option.id)}
                  className="sr-only"
                />
                <span aria-hidden="true" className={`font-sora font-bold text-[#0b1c30] leading-none ${SAMPLE_SIZE[option.id]}`}>
                  A
                </span>
                <span className={`font-outfit text-sm ${isSelected ? 'font-semibold text-[#5516be]' : 'text-[#494454]'}`}>
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <label
        className={`min-h-14 px-3 py-2 flex items-center justify-between gap-3 ${OPTION_CLASS} ${selectedClass(readAloud)} ${
          canSpeak ? '' : 'opacity-60 cursor-not-allowed'
        }`}
      >
        <span className="flex flex-col font-outfit">
          <span className="text-sm font-semibold text-[#0b1c30]">Ler em voz alta</span>
          <span className="text-xs text-[#494454]">
            {!canSpeak
              ? 'Indisponível neste navegador'
              : hasVoices
              ? 'Fala a opção que você seleciona'
              : 'Nenhuma voz instalada neste dispositivo'}
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          aria-label="Ler em voz alta"
          checked={readAloud}
          disabled={!canSpeak}
          onChange={(e) => setReadAloud(e.target.checked)}
          className="sr-only"
        />
        <span
          aria-hidden="true"
          className={`w-11 h-6 rounded-full p-0.5 shrink-0 transition-colors ${readAloud ? 'bg-[#6b38d4]' : 'bg-[#cbc3d7]'}`}
        >
          <span
            className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${readAloud ? 'translate-x-5' : ''}`}
          />
        </span>
      </label>

      <fieldset>
        <legend className="font-outfit text-sm font-semibold text-[#0b1c30] mb-2">Cores para daltonismo</legend>
        <div className="grid grid-cols-2 gap-2">
          {COLOR_VISION_MODES.map((option) => {
            const isSelected = colorVision === option.id;
            return (
              <label key={option.id} className={`min-h-14 px-3 py-2 flex flex-col justify-center ${OPTION_CLASS} ${selectedClass(isSelected)}`}>
                <input
                  type="radio"
                  name="color-vision"
                  value={option.id}
                  checked={isSelected}
                  onChange={() => setColorVision(option.id)}
                  className="sr-only"
                />
                <span className={`font-outfit text-sm font-semibold ${isSelected ? 'text-[#5516be]' : 'text-[#0b1c30]'}`}>
                  {option.label}
                </span>
                <span className="font-outfit text-xs text-[#494454]">{option.detail}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <button
        onClick={onClose}
        className="h-12 shrink-0 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-bold transition-colors"
      >
        Concluir
      </button>
    </Modal>
  );
};
