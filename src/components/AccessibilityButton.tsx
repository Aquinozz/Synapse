import React, { useState } from 'react';
import { useAccessibility } from '../accessibility/preferences';
import { AccessibilityModal } from './AccessibilityModal';

/** Header button that opens the accessibility settings; a dot shows when any adjustment is on */
export const AccessibilityButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { colorVision, textSize, readAloud } = useAccessibility();
  const isActive = colorVision !== 'none' || textSize !== 'normal' || readAloud;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-label={isActive ? 'Acessibilidade (ajustes ativos)' : 'Acessibilidade'}
        className={`no-print w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-[#494454] hover:bg-[#e5eeff] active:bg-[#dce9ff] transition-colors relative ${className}`}
      >
        <span className="material-symbols-outlined text-[1.5rem]">accessibility_new</span>
        {isActive && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#00855b] ring-2 ring-[#f8f9ff]" />
        )}
      </button>

      <AccessibilityModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
