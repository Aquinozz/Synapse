import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Accessible name of the dialog */
  label: string;
  /** Tailwind max-width class of the panel */
  maxWidth?: string;
  /** Extra classes for the panel (border colour, padding overrides...) */
  className?: string;
  /** Darker backdrop for flows that need full attention (SOS, breathing) */
  dimmed?: boolean;
  children: React.ReactNode;
}

// Open dialogs, oldest first. Only the one on top answers the keyboard, so Esc closes a
// dialog opened from another dialog without closing both.
const openDialogs: symbol[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared dialog shell: bottom sheet on phones, centered card from `sm` up.
 * Handles Esc, backdrop click, focus trap/restore and page scroll lock.
 * It is rendered straight into <body>, so it covers the viewport even when opened from inside
 * an element that confines fixed positioning (the headers use backdrop-filter, which does).
 * Children only mount while open, so their local state resets on every open.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  label,
  maxWidth = 'max-w-md',
  className = '',
  dimmed = false,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const id = Symbol('dialog');
    openDialogs.push(id);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (openDialogs[openDialogs.length - 1] !== id) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      openDialogs.splice(openDialogs.indexOf(id), 1);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-fade-in ${
        dimmed ? 'bg-[#0b1c30]/75' : 'bg-[#0b1c30]/60'
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`bg-white w-full ${maxWidth} rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl flex flex-col relative max-h-[92dvh] overflow-y-auto border border-white outline-none animate-sheet-in sm:animate-pop-in ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

interface ModalCloseButtonProps {
  onClose: () => void;
  className?: string;
}

export const ModalCloseButton: React.FC<ModalCloseButtonProps> = ({ onClose, className = '' }) => (
  <button
    type="button"
    onClick={onClose}
    aria-label="Fechar"
    className={`w-10 h-10 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] flex items-center justify-center text-[#494454] hover:text-[#0b1c30] shrink-0 transition-colors ${className}`}
  >
    <span className="material-symbols-outlined text-[1.375rem]">close</span>
  </button>
);
