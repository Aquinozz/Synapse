import React, { useState, useEffect } from 'react';
import { Avatar } from './Avatar';
import { useToast } from './Toast';

interface VideoRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Who is on the other side of the call */
  remoteName: string;
  remoteRole: string;
  remoteImage?: string;
  selfImage?: string;
  /** Title of the notes drawer */
  notesTitle?: string;
  /** When given, the notes written during the call can be saved (psychologist side) */
  onSaveNote?: (text: string) => void;
}

export const VideoRoomModal: React.FC<VideoRoomModalProps> = ({
  isOpen,
  onClose,
  ...room
}) => {
  if (!isOpen) return null;
  return <VideoRoom onClose={onClose} {...room} />;
};

const VideoRoom: React.FC<Omit<VideoRoomModalProps, 'isOpen'>> = ({
  onClose,
  remoteName,
  remoteRole,
  remoteImage,
  selfImage,
  notesTitle = 'Anotações pessoais',
  onSaveNote,
}) => {
  const showToast = useToast();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Teleconsulta com ${remoteName}`}
      className="fixed inset-0 z-50 bg-[#0b1c30] flex flex-col animate-fade-in"
    >
      {/* Top Header */}
      <div className="min-h-16 px-4 pt-[env(safe-area-inset-top,0px)] bg-[#0b1c30]/90 backdrop-blur-md flex items-center justify-between gap-2 text-white border-b border-white/10 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00855b]/20 text-[#6ffbbe] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
            <span className="truncate">Teleconsulta Criptografada</span>
          </div>
          <span className="text-xs text-white/60 hidden sm:inline">
            Sigilo Médico e Psicológico CFP
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1 rounded-full bg-white/10 text-xs font-mono text-white/90 tabular-nums">
            {formatTime(seconds)}
          </div>
          <button
            onClick={() => setShowNotes(!showNotes)}
            aria-label="Anotações"
            aria-pressed={showNotes}
            className={`px-3 py-2 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors ${
              showNotes ? 'bg-[#6b38d4] text-white' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">description</span>
            <span className="hidden xs:inline">Anotações</span>
          </button>
        </div>
      </div>

      {/* Main Video Stage */}
      <div className="flex-1 relative flex items-center justify-center p-3 overflow-hidden">
        {/* Doctor Main Video Stream */}
        <div className="w-full h-full max-w-4xl rounded-2xl overflow-hidden relative shadow-2xl bg-black flex items-center justify-center">
          {remoteImage ? (
            <img src={remoteImage} alt={remoteName} className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full bg-[#213145] flex items-center justify-center">
              <Avatar name={remoteName} className="w-28 h-28 text-4xl" />
            </div>
          )}

          {/* Doctor Label overlay */}
          <div className="absolute bottom-4 left-4 z-10 max-w-[calc(100%-9.5rem)] flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium">
            <span className="w-2 h-2 shrink-0 rounded-full bg-[#4edea3]" />
            <span className="truncate">{remoteName} · {remoteRole}</span>
          </div>

          {/* Sound wave activity badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs">
            <span className="material-symbols-outlined text-[16px] text-[#6ffbbe]">mic</span>
            <div className="flex items-end gap-0.5 h-3" aria-hidden="true">
              <span className="w-1 bg-[#6ffbbe] h-2 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 bg-[#6ffbbe] h-3 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 bg-[#6ffbbe] h-1.5 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>

          {/* User Self View PiP */}
          <div className="absolute bottom-4 right-4 w-28 h-40 sm:w-36 sm:h-48 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-800 z-20">
            {camOn && selfImage ? (
              <img src={selfImage} alt="Você" className="w-full h-full object-cover" />
            ) : camOn ? (
              <div className="w-full h-full flex items-center justify-center text-white/50">
                <span className="material-symbols-outlined text-[32px]">person</span>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/50 text-xs">
                <span className="material-symbols-outlined text-[24px]">videocam_off</span>
                <span>Câmera desligada</span>
              </div>
            )}
            <div className="absolute bottom-1 left-2 text-[10px] text-white/80 bg-black/50 px-1 rounded font-outfit">
              Você
            </div>
          </div>
        </div>

        {/* Floating Notes Drawer (if opened) */}
        {showNotes && (
          <div className="absolute top-4 right-4 bottom-4 w-[min(20rem,calc(100%-2rem))] bg-[#ffffff]/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl z-30 flex flex-col border border-white animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-[#eff4ff]">
              <span className="font-sora text-xs font-bold text-[#0b1c30]">
                {notesTitle}
              </span>
              <button
                onClick={() => setShowNotes(false)}
                aria-label="Fechar notas"
                className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-[#494454] hover:text-[#0b1c30] hover:bg-[#eff4ff]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="text-[11px] text-[#494454] my-2">
              Somente você tem acesso a estas anotações.
            </p>
            <textarea
              aria-label="Anotações da sessão"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 w-full p-2.5 rounded-xl bg-[#eff4ff] text-xs text-[#0b1c30] resize-none focus:outline-none focus:ring-2 focus:ring-[#6b38d4]/30"
              placeholder="Digite reflexões ou acordos da sessão..."
            />
            {onSaveNote && (
              <button
                disabled={!notes.trim()}
                onClick={() => {
                  onSaveNote(notes.trim());
                  setNotes('');
                  showToast('Anotação salva na ficha do paciente.');
                }}
                className="mt-2 h-10 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold transition-colors disabled:bg-[#cbc3d7]"
              >
                Salvar na ficha do paciente
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Call Action Controls */}
      <div className="min-h-20 bg-[#0b1c30]/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-center gap-4 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => setMicOn(!micOn)}
          aria-label={micOn ? 'Silenciar microfone' : 'Ativar microfone'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            micOn ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-[#ba1a1a] text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            {micOn ? 'mic' : 'mic_off'}
          </span>
        </button>

        <button
          onClick={() => setCamOn(!camOn)}
          aria-label={camOn ? 'Desligar Câmera' : 'Ligar Câmera'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            camOn ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-[#ba1a1a] text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            {camOn ? 'videocam' : 'videocam_off'}
          </span>
        </button>

        <button
          onClick={onClose}
          aria-label="Encerrar Chamada"
          className="h-12 px-6 rounded-full bg-[#ba1a1a] hover:bg-[#93000a] text-white font-outfit text-sm font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">call_end</span>
          <span>Encerrar Sessão</span>
        </button>
      </div>
    </div>
  );
};
