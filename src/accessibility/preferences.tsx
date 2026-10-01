import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { getPageScroll, setPageScroll } from '../utils/scroll';
import { COLOR_VISION_MODES, ColorVisionFilters, ColorVisionMode } from './colorVision';
import { isSpeechSupported, speak, startReadAloud } from './speech';

export type TextSize = 'normal' | 'large' | 'larger';

export const TEXT_SIZES: { id: TextSize; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'large', label: 'Grande' },
  { id: 'larger', label: 'Maior' },
];

const STORAGE_KEYS = {
  colorVision: 'synapse:color-vision',
  textSize: 'synapse:text-size',
  readAloud: 'synapse:read-aloud',
};

/** Reads a saved choice, falling back to the default when it is missing or no longer valid */
const readStored = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return allowed.includes(stored as T) ? (stored as T) : fallback;
  } catch {
    return fallback;
  }
};

const store = (key: string, value: string, isDefault: boolean) => {
  try {
    if (isDefault) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the choice lasts until the tab is reloaded
  }
};

interface AccessibilityContextValue {
  colorVision: ColorVisionMode;
  setColorVision: (mode: ColorVisionMode) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  /** Speaks the option in focus or tapped */
  readAloud: boolean;
  setReadAloud: (on: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

/**
 * Keeps the accessibility preferences, remembers them in this browser and flags them on
 * <html> as data attributes. The rules in index.css read those flags: one puts the colour
 * filter on <body>, the other raises the font sizes of the theme. Read-aloud is handled
 * here, by listening to focus and clicks while it is on.
 */
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorVision, setColorVisionState] = useState<ColorVisionMode>(() =>
    readStored(STORAGE_KEYS.colorVision, COLOR_VISION_MODES.map((m) => m.id), 'none')
  );
  const [textSize, setTextSizeState] = useState<TextSize>(() =>
    readStored(STORAGE_KEYS.textSize, TEXT_SIZES.map((s) => s.id), 'normal')
  );

  useLayoutEffect(() => {
    const root = document.documentElement;
    // Turning a colour mode on or off changes which element scrolls; keep the reader where they were
    const scroll = getPageScroll();
    if (colorVision === 'none') delete root.dataset.colorVision;
    else root.dataset.colorVision = colorVision;
    setPageScroll(scroll);
  }, [colorVision]);

  const [readAloud, setReadAloudState] = useState<boolean>(
    () => isSpeechSupported() && readStored(STORAGE_KEYS.readAloud, ['on', 'off'], 'off') === 'on'
  );

  useEffect(() => (readAloud ? startReadAloud() : undefined), [readAloud]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (textSize === 'normal') delete root.dataset.textSize;
    else root.dataset.textSize = textSize;
  }, [textSize]);

  const setColorVision = useCallback((mode: ColorVisionMode) => {
    setColorVisionState(mode);
    store(STORAGE_KEYS.colorVision, mode, mode === 'none');
  }, []);

  const setTextSize = useCallback((size: TextSize) => {
    setTextSizeState(size);
    store(STORAGE_KEYS.textSize, size, size === 'normal');
  }, []);

  const setReadAloud = useCallback((on: boolean) => {
    setReadAloudState(on);
    store(STORAGE_KEYS.readAloud, 'on', !on);
    // Confirms the change out loud; it is also the user gesture some browsers need to allow speech
    speak(on ? 'Leitura em voz alta ativada' : 'Leitura em voz alta desativada');
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{ colorVision, setColorVision, textSize, setTextSize, readAloud, setReadAloud }}
    >
      <ColorVisionFilters />
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used inside AccessibilityProvider');
  return ctx;
};
