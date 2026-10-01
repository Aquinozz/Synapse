import React, { useEffect, useId, useRef, useState } from 'react';

export interface MultiSelectOption {
  value: string;
  /** How many results have this option, shown beside it */
  count?: number;
}

interface MultiSelectProps {
  label: string;
  placeholder: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

/** Above this many options the list gets a search box */
const SEARCH_THRESHOLD = 8;

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * Dropdown for choosing several options: a button that opens a list of checkboxes.
 * Closes with Esc or a click outside, and long lists can be searched.
 */
export const MultiSelect: React.FC<MultiSelectProps> = ({ label, placeholder, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  const visible = options.filter((option) => normalize(option.value).includes(normalize(query.trim())));
  const summary =
    selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} selecionadas`;

  return (
    <div ref={root} className="relative flex flex-col gap-1.5 min-w-0">
      <span id={`${id}-label`} className="font-outfit text-xs font-semibold uppercase tracking-wider text-[#dbe1ff]">
        {label}
      </span>
      <button
        ref={button}
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setQuery('');
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-labelledby={`${id}-label ${id}-value`}
        className="h-13 px-4 rounded-2xl bg-white text-left flex items-center justify-between gap-2 shadow-sm focus-visible:ring-4 focus-visible:ring-white/40 focus-visible:outline-none"
      >
        <span
          id={`${id}-value`}
          className={`font-outfit text-sm lg:text-base truncate ${selected.length ? 'text-[#0b1c30] font-semibold' : 'text-[#7b7486]'}`}
        >
          {summary}
        </span>
        <span
          className={`material-symbols-outlined text-[1.5rem] text-[#6b38d4] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white rounded-2xl shadow-xl border border-[#e5eeff] p-2 flex flex-col gap-1 animate-fade-in">
          {options.length > SEARCH_THRESHOLD && (
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={`Buscar em ${label.toLowerCase()}`}
              placeholder="Buscar..."
              className="h-11 px-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] font-outfit text-sm text-[#0b1c30] placeholder:text-[#7b7486] focus:outline-none focus:border-[#6b38d4] focus:ring-2 focus:ring-[#6b38d4]/20"
            />
          )}
          <div role="group" aria-labelledby={`${id}-label`} className="max-h-64 overflow-y-auto flex flex-col">
            {visible.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={`min-h-11 px-3 py-2 rounded-xl flex items-center gap-2.5 cursor-pointer font-outfit text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#6b38d4] ${
                    isSelected ? 'bg-[#e9ddff]/50 text-[#5516be] font-semibold' : 'text-[#0b1c30] hover:bg-[#eff4ff]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(option.value)}
                    className="w-4.5 h-4.5 shrink-0 accent-[#6b38d4]"
                  />
                  <span className="flex-1 min-w-0">{option.value}</span>
                  {option.count !== undefined && (
                    <span className="text-xs font-normal text-[#7b7486] tabular-nums">{option.count}</span>
                  )}
                </label>
              );
            })}
            {visible.length === 0 && (
              <p className="px-3 py-3 font-outfit text-sm text-[#494454]">Nada encontrado.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
