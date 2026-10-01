import React, { useEffect, useRef, useState } from 'react';
import { Therapist } from '../types';
import { Avatar } from './Avatar';
import { Modal, ModalCloseButton } from './Modal';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapist: Therapist | null;
  /** The signed-in employee: the conversation is kept per person, in this browser */
  userId: number;
  userName: string;
  onOpenSOS: () => void;
}

interface ChatMessage {
  id: string;
  from: 'me' | 'therapist';
  text: string;
  /** ISO date-time */
  sentAt: string;
}

// DEMONSTRATION ONLY. Nothing typed here is sent anywhere: the conversation lives in this
// browser and the psychologist's answers are picked from the fixed lists below.

const MESSAGE_MAX = 500;
const REPLY_DELAY_MS = 1600;

const storageKey = (userId: number, therapistId: number) => `synapse:demo-chat:${userId}:${therapistId}`;

const loadMessages = (key: string): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
};

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

// Words that call for emergency help rather than a chat answer
const CRISIS = ['suicid', 'me matar', 'tirar minha vida', 'nao aguento mais', 'acabar com tudo', 'me machucar', 'morrer'];

const REPLIES: { words: string[]; text: string }[] = [
  {
    words: ['remarcar', 'horario', 'adiar', 'desmarcar', 'atras'],
    text: 'Sem problema. Você pode mudar a sessão desta semana em "Remarcar a semana", no Início, e escolher outro horário livre da minha agenda.',
  },
  {
    words: ['ansios', 'ansiedade', 'nervos', 'panico', 'crise'],
    text: 'Sinto muito que esteja assim. Tente a respiração 4-7-8 em "Pausa guiada" agora, por alguns minutos. Na nossa próxima sessão olhamos com calma para o que disparou isso.',
  },
  {
    words: ['dormi', 'sono', 'insonia', 'cansad', 'exaust'],
    text: 'O cansaço pesa em tudo. Anote os horários em que você dormiu e acordou nestes dias; vamos usar esse registro na próxima sessão.',
  },
  {
    words: ['trabalho', 'chefe', 'prazo', 'reuniao', 'equipe'],
    text: 'Entendo. Tente anotar o que aconteceu e como você reagiu, ainda hoje, enquanto está fresco. Isso ajuda muito na nossa conversa.',
  },
  {
    words: ['obrigad', 'valeu', 'agradec'],
    text: 'Eu que agradeço por compartilhar. Estou por aqui.',
  },
  {
    words: ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite'],
    text: 'Olá! Como você está hoje?',
  },
];

const FALLBACKS = [
  'Agradeço por me contar. Como você se sentiu com isso?',
  'Entendi. Vamos retomar esse ponto na nossa próxima sessão, com mais tempo.',
  'Faz sentido. O que você acha que ajudaria você agora?',
];

const CRISIS_REPLY =
  'O que você escreveu me preocupa, e quero que você tenha ajuda agora. Ligue 188 (CVV, 24 horas, gratuito) ou 192 (SAMU), ou toque em "Abrir SOS" abaixo. Este chat não é um canal de emergência.';

const pickReply = (text: string, replyCount: number) => {
  const plain = normalize(text);
  if (CRISIS.some((word) => plain.includes(word))) return { text: CRISIS_REPLY, isCrisis: true };
  const match = REPLIES.find((reply) => reply.words.some((word) => new RegExp(`\\b${word}`).test(plain)));
  return { text: match?.text ?? FALLBACKS[replyCount % FALLBACKS.length], isCrisis: false };
};

const newMessage = (from: ChatMessage['from'], text: string): ChatMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  from,
  text,
  sentAt: new Date().toISOString(),
});

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, therapist, ...rest }) => (
  <Modal
    isOpen={isOpen && therapist !== null}
    onClose={onClose}
    label={therapist ? `Conversa com ${therapist.name}` : 'Conversa'}
    maxWidth="max-w-lg"
    className="gap-3 h-[92dvh] sm:h-[min(42rem,88dvh)] !overflow-hidden"
  >
    {therapist && <Conversation therapist={therapist} onClose={onClose} {...rest} />}
  </Modal>
);

const Conversation: React.FC<Omit<ChatModalProps, 'isOpen' | 'therapist'> & { therapist: Therapist }> = ({
  therapist,
  userId,
  userName,
  onClose,
  onOpenSOS,
}) => {
  const key = storageKey(userId, therapist.id);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(key));
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const replyTimer = useRef<number | undefined>(undefined);

  const firstName = userName.split(' ')[0];
  const greeting = `Olá, ${firstName}! Este é o nosso canal entre as sessões. Pode me escrever quando quiser.`;

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(messages));
    } catch {
      // Storage unavailable: the conversation lasts until the tab is reloaded
    }
  }, [key, messages]);

  // Keeps the latest message in view
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => () => window.clearTimeout(replyTimer.current), []);

  const send = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [...current, newMessage('me', text)]);
    setDraft('');

    const replyCount = messages.filter((message) => message.from === 'therapist').length;
    const reply = pickReply(text, replyCount);
    if (reply.isCrisis) setShowSOS(true);
    setIsTyping(true);
    window.clearTimeout(replyTimer.current);
    replyTimer.current = window.setTimeout(() => {
      setMessages((current) => [...current, newMessage('therapist', reply.text)]);
      setIsTyping(false);
    }, REPLY_DELAY_MS);
  };

  const clear = () => {
    window.clearTimeout(replyTimer.current);
    setIsTyping(false);
    setShowSOS(false);
    setMessages([]);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={therapist.name} image={therapist.avatar} className="w-11 h-11 text-sm" />
          <div className="flex flex-col min-w-0 font-outfit">
            <h3 className="font-sora text-base font-bold text-[#0b1c30] truncate">{therapist.name}</h3>
            <span className="text-xs text-[#494454] truncate">{therapist.reg}</span>
          </div>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>

      <p className="shrink-0 p-3 rounded-2xl bg-[#fff8e8] border border-[#ffd8a8] font-outfit text-xs text-[#7a4100] leading-snug flex items-start gap-2">
        <span className="material-symbols-outlined text-[1.125rem] shrink-0">info</span>
        <span>
          <strong className="font-semibold">Chat de demonstração.</strong> As respostas são automáticas e as mensagens
          não chegam ao psicólogo; ficam só neste navegador.
        </span>
      </p>

      <div
        ref={logRef}
        role="log"
        aria-label="Mensagens"
        aria-live="polite"
        tabIndex={0}
        className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 py-1 pr-1 rounded-xl"
      >
        <Bubble from="therapist" text={greeting} />
        {messages.map((message) => (
          <Bubble key={message.id} from={message.from} text={message.text} time={formatTime(message.sentAt)} />
        ))}
        {isTyping && (
          <p className="self-start px-3.5 py-2 rounded-2xl rounded-bl-md bg-[#eff4ff] font-outfit text-sm text-[#494454] italic">
            {therapist.name.split(' ').slice(0, 2).join(' ')} está digitando...
          </p>
        )}
      </div>

      {showSOS && (
        <button
          type="button"
          onClick={onOpenSOS}
          className="shrink-0 min-h-11 px-4 py-1.5 rounded-full bg-[#ba1a1a] hover:bg-[#93000a] text-white font-outfit text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-[1.25rem] fill-1">shield_with_heart</span>
          Abrir SOS
        </button>
      )}

      <form onSubmit={send} className="shrink-0 flex items-end gap-2">
        <label htmlFor="chat-draft" className="sr-only">
          Escreva uma mensagem
        </label>
        <textarea
          id="chat-draft"
          rows={1}
          maxLength={MESSAGE_MAX}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter breaks the line
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) send(e);
          }}
          placeholder="Escreva uma mensagem"
          className="flex-1 min-w-0 min-h-12 max-h-28 px-4 py-3 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff] text-base font-outfit text-[#0b1c30] placeholder:text-[#7b7486] resize-none focus:outline-none focus:border-[#6b38d4] focus:ring-2 focus:ring-[#6b38d4]/20"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Enviar mensagem"
          className="w-12 h-12 shrink-0 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white flex items-center justify-center transition-all active:scale-95 disabled:bg-[#cbc3d7] disabled:active:scale-100"
        >
          <span className="material-symbols-outlined text-[1.375rem]">send</span>
        </button>
      </form>

      {messages.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className="shrink-0 self-center h-9 px-3 rounded-full font-outfit text-xs font-semibold text-[#494454] hover:bg-[#eff4ff] transition-colors"
        >
          Limpar conversa
        </button>
      )}
    </>
  );
};

const Bubble: React.FC<{ from: ChatMessage['from']; text: string; time?: string }> = ({ from, text, time }) => (
  <div
    className={`max-w-[85%] px-3.5 py-2 rounded-2xl font-outfit text-sm leading-relaxed flex flex-col ${
      from === 'me' ? 'self-end bg-[#6b38d4] text-white rounded-br-md' : 'self-start bg-[#eff4ff] text-[#0b1c30] rounded-bl-md'
    }`}
  >
    <span className="sr-only">{from === 'me' ? 'Você: ' : 'Psicólogo: '}</span>
    <span className="whitespace-pre-wrap break-words">{text}</span>
    {time && (
      <span className={`self-end text-2xs tabular-nums ${from === 'me' ? 'text-white/75' : 'text-[#7b7486]'}`}>{time}</span>
    )}
  </div>
);
