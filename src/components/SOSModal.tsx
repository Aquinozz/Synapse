import React, { useState } from 'react';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose }) => {
  const [connectingChat, setConnectingChat] = useState(false);
  const [chatConnected, setChatConnected] = useState(false);

  if (!isOpen) return null;

  const handleStartChat = () => {
    setConnectingChat(true);
    setTimeout(() => {
      setConnectingChat(false);
      setChatConnected(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1c30]/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#ffffff] w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col relative max-h-[90vh] overflow-y-auto border border-[#ffdad6]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[20px] fill-1">shield_with_heart</span>
            </div>
            <div>
              <span className="font-outfit text-[11px] font-bold uppercase tracking-wider text-[#ba1a1a]">
                Suporte Emergencial 24/7
              </span>
              <h3 className="font-sora text-lg font-bold text-[#0b1c30]">
                SOS & Acolhimento
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#494454] hover:text-[#0b1c30]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Notice of Total Anonymity */}
        <div className="my-3 p-3 rounded-2xl bg-[#eff4ff] flex items-start gap-2 text-[12px] font-outfit text-[#494454]">
          <span className="material-symbols-outlined text-[18px] text-[#0051d5] shrink-0">verified_user</span>
          <p>
            <strong>Sigilo Ético Absoluto:</strong> O uso deste canal é estritamente confidencial. Nenhum dado ou notificação é gerado para a sua empresa ou liderança.
          </p>
        </div>

        {chatConnected ? (
          <div className="flex flex-col gap-3 py-2">
            <div className="p-3 bg-[#e5eeff] rounded-2xl border border-[#dce9ff] text-sm">
              <div className="flex items-center gap-2 font-bold text-[#0051d5] mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00855b] animate-pulse" />
                <span>Psicóloga Plantonista Conectada</span>
              </div>
              <p className="text-[#0b1c30] text-xs">
                Olá, Marina. Estou aqui com você em um espaço 100% seguro e acolhedor. Respire com calma. Como posso te apoiar agora?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Escreva sua mensagem com calma..."
                className="flex-1 h-11 px-4 rounded-full bg-[#eff4ff] text-sm text-[#0b1c30] placeholder:text-[#7b7486] focus:outline-none focus:ring-2 focus:ring-[#6b38d4]/30"
              />
              <button
                onClick={() => alert('Mensagem enviada para o canal de acolhimento.')}
                className="w-11 h-11 rounded-full bg-[#6b38d4] text-white flex items-center justify-center shrink-0 shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 py-2">
            {/* Action 1: Direct Human Triage */}
            <button
              onClick={handleStartChat}
              disabled={connectingChat}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#ba1a1a] to-[#e63946] text-white text-left shadow-md hover:opacity-95 transition-all flex items-center justify-between group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">support_agent</span>
                </div>
                <div>
                  <div className="font-sora text-sm font-bold flex items-center gap-1.5">
                    <span>Falar com Plantonista Agora</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-white/30 text-[10px] uppercase font-bold">Ao Vivo</span>
                  </div>
                  <p className="text-[12px] opacity-90 font-outfit">
                    Atendimento imediato via chat ou áudio com psicólogo credenciado.
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                {connectingChat ? 'refresh' : 'arrow_forward'}
              </span>
            </button>

            {/* Action 2: CVV Phone */}
            <a
              href="tel:188"
              className="w-full p-3.5 rounded-2xl bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] text-left transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#dbe1ff] flex items-center justify-center text-[#0051d5] shrink-0">
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </div>
                <div>
                  <div className="font-sora text-sm font-bold">Ligue 188 · CVV Oficial</div>
                  <p className="text-[12px] text-[#494454] font-outfit">
                    Apoio emocional gratuito e nacional 24h por dia.
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[18px] text-[#494454]">open_in_new</span>
            </a>

            {/* Somatic grounding 5-4-3-2-1 */}
            <div className="p-3.5 rounded-2xl bg-[#f5fff6] border border-[#6ffbbe]/40 text-[#002113]">
              <div className="flex items-center gap-1.5 font-bold font-sora text-xs text-[#006947] mb-1">
                <span className="material-symbols-outlined text-[16px]">self_improvement</span>
                <span>Técnica Rápida 5-4-3-2-1 para Crises</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#005236] font-outfit">
                Encontre ao seu redor: <strong>5</strong> coisas que você vê, <strong>4</strong> que pode tocar, <strong>3</strong> sons que ouve, <strong>2</strong> aromas e <strong>1</strong> respiração profunda e longa.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full h-11 mt-2 rounded-full bg-[#f8f9ff] hover:bg-[#eff4ff] text-[#494454] font-outfit text-sm font-medium transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
