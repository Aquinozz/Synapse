import React, { useEffect, useRef, useState } from 'react';
import { Modal, ModalCloseButton } from './Modal';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    label="SOS e Acolhimento"
    className="!border-[#ffdad6]"
    dimmed
  >
    <SOSContent onClose={onClose} />
  </Modal>
);

const SOSContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [connectingChat, setConnectingChat] = useState(false);
  const [chatConnected, setChatConnected] = useState(false);
  const [draft, setDraft] = useState('');
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const connectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (connectTimer.current) clearTimeout(connectTimer.current);
    };
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [sentMessages]);

  const handleStartChat = () => {
    setConnectingChat(true);
    connectTimer.current = setTimeout(() => {
      setConnectingChat(false);
      setChatConnected(true);
    }, 1500);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSentMessages((current) => [...current, text]);
    setDraft('');
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
            <span className="material-symbols-outlined text-[1.375rem] fill-1">shield_with_heart</span>
          </div>
          <div>
            <span className="font-outfit text-2xs font-bold uppercase tracking-wider text-[#ba1a1a]">
              Suporte Emergencial 24/7
            </span>
            <h3 className="font-sora text-lg font-bold text-[#0b1c30]">
              SOS & Acolhimento
            </h3>
          </div>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>

      {/* Notice of Total Anonymity */}
      <div className="my-3 p-3 rounded-2xl bg-[#eff4ff] flex items-start gap-2 text-xs font-outfit text-[#494454]">
        <span className="material-symbols-outlined text-[1.25rem] text-[#0051d5] shrink-0">verified_user</span>
        <p>
          <strong>Sigilo Ético Absoluto:</strong> O uso deste canal é estritamente confidencial. Nenhum dado ou notificação é gerado para a sua empresa ou liderança.
        </p>
      </div>

      {chatConnected ? (
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            <div className="p-3 bg-[#e5eeff] rounded-2xl rounded-tl-md border border-[#dce9ff] text-sm mr-8">
              <div className="flex items-center gap-2 font-bold text-[#0051d5] mb-1 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00855b] animate-pulse" />
                <span>Psicóloga Plantonista Conectada</span>
              </div>
              <p className="text-[#0b1c30] text-xs leading-relaxed">
                Olá, Marina. Estou aqui com você em um espaço 100% seguro e acolhedor. Respire com calma. Como posso te apoiar agora?
              </p>
            </div>

            {sentMessages.map((message, idx) => (
              <div
                key={idx}
                className="self-end ml-8 px-3 py-2 rounded-2xl rounded-br-md bg-[#6b38d4] text-white text-xs font-outfit leading-relaxed break-words max-w-full"
              >
                {message}
              </div>
            ))}
            {sentMessages.length > 0 && (
              <span className="self-end text-3xs text-[#7b7486] font-outfit flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">done_all</span>
                Enviada com criptografia
              </span>
            )}
            <div ref={threadEndRef} />
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <label className="sr-only" htmlFor="sos-message">
              Mensagem para a plantonista
            </label>
            <input
              id="sos-message"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoComplete="off"
              autoFocus
              placeholder="Escreva sua mensagem com calma..."
              className="flex-1 min-w-0 h-11 px-4 rounded-full bg-[#eff4ff] text-sm text-[#0b1c30] placeholder:text-[#7b7486] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]/30"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Enviar mensagem"
              className="w-11 h-11 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white flex items-center justify-center shrink-0 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[1.375rem]">send</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 py-2">
          {/* Action 1: Direct Human Triage */}
          <button
            onClick={handleStartChat}
            disabled={connectingChat}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#ba1a1a] to-[#e63946] text-white text-left shadow-md hover:opacity-95 transition-all flex items-center justify-between gap-2 group active:scale-[0.99] disabled:opacity-90"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[1.5rem]">support_agent</span>
              </div>
              <div>
                <div className="font-sora text-sm font-bold flex items-center gap-1.5 flex-wrap">
                  <span>{connectingChat ? 'Conectando com a plantonista...' : 'Falar com Plantonista Agora'}</span>
                  {!connectingChat && (
                    <span className="px-1.5 py-0.5 rounded-full bg-white/30 text-3xs uppercase font-bold">Ao Vivo</span>
                  )}
                </div>
                <p className="text-xs opacity-90 font-outfit">
                  Atendimento imediato via chat ou áudio com psicólogo credenciado.
                </p>
              </div>
            </div>
            <span
              className={`material-symbols-outlined text-[1.375rem] shrink-0 ${
                connectingChat ? 'animate-spin' : 'group-hover:translate-x-1 transition-transform'
              }`}
            >
              {connectingChat ? 'progress_activity' : 'arrow_forward'}
            </span>
          </button>

          {/* Action 2: CVV Phone */}
          <a
            href="tel:188"
            className="w-full p-3.5 rounded-2xl bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] text-left transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#dbe1ff] flex items-center justify-center text-[#0051d5] shrink-0">
                <span className="material-symbols-outlined text-[1.375rem]">call</span>
              </div>
              <div>
                <div className="font-sora text-sm font-bold">Ligue 188 · CVV Oficial</div>
                <p className="text-xs text-[#494454] font-outfit">
                  Apoio emocional gratuito e nacional 24h por dia.
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[1.25rem] text-[#494454]">open_in_new</span>
          </a>

          {/* Somatic grounding 5-4-3-2-1 */}
          <div className="p-3.5 rounded-2xl bg-[#f5fff6] border border-[#6ffbbe]/40 text-[#002113]">
            <div className="flex items-center gap-1.5 font-bold font-sora text-xs text-[#006947] mb-1">
              <span className="material-symbols-outlined text-[1.125rem]">self_improvement</span>
              <span>Técnica Rápida 5-4-3-2-1 para Crises</span>
            </div>
            <p className="text-2xs leading-relaxed text-[#005236] font-outfit">
              Encontre ao seu redor: <strong>5</strong> coisas que você vê, <strong>4</strong> que pode tocar, <strong>3</strong> sons que ouve, <strong>2</strong> aromas e <strong>1</strong> respiração profunda e longa.
            </p>
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full h-11 mt-2 shrink-0 rounded-full bg-[#f8f9ff] hover:bg-[#eff4ff] text-[#494454] font-outfit text-sm font-medium transition-colors"
      >
        Fechar
      </button>
    </>
  );
};
