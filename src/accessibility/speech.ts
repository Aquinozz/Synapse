import { useEffect, useState } from 'react';

// Read-aloud for people with low vision: speaks the option that receives focus or is
// tapped, using the browser's own speech synthesis (no audio files, no external service).

export const isSpeechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

const INTERACTIVE = 'a[href], button, input, select, textarea, summary, label, [role="button"], [role="radio"], [role="tab"]';
const MAX_LENGTH = 220;

const langOf = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase().replace('_', '-');

/**
 * The most natural Portuguese voice the device offers. Devices differ a lot: phones, Windows
 * and macOS ship natural voices, while Linux usually only has the synthetic eSpeak ones.
 */
const pickVoice = () => {
  const score = (voice: SpeechSynthesisVoice) =>
    (langOf(voice) === 'pt-br' ? 10 : 0) +
    // Voices from the system vendors and the neural ones sound the most natural
    (/google|microsoft|natural|neural|luciana|francisca|felipe|siri/i.test(voice.name) ? 5 : 0) +
    // eSpeak lists hundreds of "+variant" voices; the plain one is the clearest of them
    (voice.name.includes('+') ? -2 : 0);
  return window.speechSynthesis
    .getVoices()
    .filter((voice) => langOf(voice).startsWith('pt'))
    .reduce<SpeechSynthesisVoice | null>((best, voice) => (best && score(best) >= score(voice) ? best : voice), null);
};

/** Speaks a text, replacing whatever was being said */
export const speak = (text: string) => {
  if (!isSpeechSupported() || !text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  // A little slower than the default, which synthetic voices rush through
  utterance.rate = 0.9;
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

/**
 * Whether the device has any voice installed. Without one the browser accepts the request
 * and stays silent. The list can arrive late, hence the listener.
 */
export const useHasVoices = () => {
  const [hasVoices, setHasVoices] = useState(() => isSpeechSupported() && window.speechSynthesis.getVoices().length > 0);
  useEffect(() => {
    if (!isSpeechSupported()) return;
    const update = () => setHasVoices(window.speechSynthesis.getVoices().length > 0);
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);
  return hasVoices;
};

export const stopSpeaking = () => {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
};

/** Visible text of an element, without icon names and other content hidden from assistive tech */
const readableText = (el: Element) => {
  const clone = el.cloneNode(true) as Element;
  clone.querySelectorAll('.material-symbols-outlined, [aria-hidden="true"], svg').forEach((node) => node.remove());
  // Text nodes are joined with a space: a title and its description are separate elements
  // with no whitespace between them, and would otherwise be read as one word
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];
  while (walker.nextNode()) parts.push(walker.currentNode.textContent ?? '');
  return parts.join(' ').replace(/\s+/g, ' ').trim();
};

const labelOfField = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
  const byFor = field.id ? document.querySelector(`label[for="${CSS.escape(field.id)}"]`) : null;
  const wrapping = field.closest('label');
  return (byFor && readableText(byFor)) || (wrapping && readableText(wrapping)) || field.getAttribute('placeholder') || '';
};

const nameOf = (el: Element) => {
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = labelledBy
      .split(' ')
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null)
      .map(readableText)
      .join(' ');
    if (text) return text;
  }
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
    return labelOfField(el);
  }
  return readableText(el) || el.getAttribute('title') || '';
};

/** The state of the control (selected, on, unavailable...), said after the name when it matters */
const detailOf = (el: Element) => {
  const role = el.getAttribute('role');
  if (el instanceof HTMLInputElement) {
    if (el.type === 'radio') return el.checked ? 'opção selecionada' : 'opção';
    if (el.type === 'checkbox') return el.checked ? 'ativado' : 'desativado';
    if (el.type === 'range') return `valor ${el.value}`;
    // The content of text and password fields is never spoken
    return 'campo de texto';
  }
  if (el instanceof HTMLTextAreaElement) return 'campo de texto';
  if (role === 'radio') return el.getAttribute('aria-checked') === 'true' ? 'opção selecionada' : 'opção';
  if (el.getAttribute('aria-current') === 'page' || el.getAttribute('aria-selected') === 'true') return 'selecionado';
  if (el.getAttribute('aria-pressed') === 'true') return 'selecionado';
  if (el instanceof HTMLButtonElement && el.disabled) return 'indisponível';
  // Plain links and buttons are announced by their name alone: naming the kind every time is noise
  return '';
};

/** The sentence spoken for an element, or '' when there is nothing useful to say */
export const describe = (target: Element) => {
  let el = target.closest(INTERACTIVE);
  if (!el) return '';
  // A label speaks for the field it wraps, so the state (selected or not) is included
  if (el instanceof HTMLLabelElement) el = el.control ?? el;
  const name = nameOf(el).slice(0, MAX_LENGTH);
  if (!name) return '';
  const detail = detailOf(el);
  return detail ? `${name}, ${detail}` : name;
};

/**
 * Starts speaking the option in focus, tapped or just selected. Returns the function that stops it.
 * Focus covers keyboard navigation; click covers touch and mouse; change announces the new
 * state of a radio or switch.
 */
export const startReadAloud = () => {
  let last = { text: '', at: 0 };
  const say = (text: string) => {
    // A click usually also moves focus: say it once
    const now = Date.now();
    if (!text || (text === last.text && now - last.at < 600)) return;
    last = { text, at: now };
    speak(text);
  };

  const onFocus = (e: FocusEvent) => e.target instanceof Element && say(describe(e.target));
  const onClick = (e: MouseEvent) => e.target instanceof Element && say(describe(e.target));
  const onChange = (e: Event) => {
    const el = e.target;
    if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox' || el.type === 'range')) {
      say(describe(el));
    }
  };

  document.addEventListener('focusin', onFocus);
  document.addEventListener('click', onClick, true);
  document.addEventListener('change', onChange);
  return () => {
    document.removeEventListener('focusin', onFocus);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('change', onChange);
    // Speech in progress is left to finish: turning the option off is confirmed out loud
  };
};
