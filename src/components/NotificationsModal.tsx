import React from 'react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSession: () => void;
  onOpenAssessment: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onOpenSession,
  onOpenAssessment,
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: '1',
      title: 'Sessão em 1h 42m',
      desc: 'Sua consulta confidencial com Dra. Camila Rossi acontecerá às 16:30.',
      time: 'Agora',
      icon: 'video_camera_front',
      color: 'text-[#6b38d4]',
      bg: 'bg-[#e9ddff]',
      action: () => {
        onClose();
        onOpenSession();
      },
      actionText: 'Acessar Sala',
    },
    {
      id: '2',
      title: 'Lembrete de Autoavaliação',
      desc: 'Etapa semanal de resiliência cognitiva disponível (2 min).',
      time: 'Hoje',
      icon: 'fact_check',
      color: 'text-[#0051d5]',
      bg: 'bg-[#dbe1ff]',
      action: () => {
        onClose();
        onOpenAssessment();
      },
      actionText: 'Fazer Check-in',
    },
    {
      id: '3',
      title: 'Benefício Mensal Renovado',
      desc: '4 sessões corporativas 100% subsidiadas disponíveis para agendamento.',
      time: 'Ontem',
      icon: 'verified',
      color: 'text-[#00855b]',
      bg: 'bg-[#6ffbbe]/30',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1c30]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#ffffff] w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col relative max-h-[85vh] overflow-y-auto border border-white">
        <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#6b38d4]">notifications</span>
            <h3 className="font-sora text-base font-bold text-[#0b1c30]">Notificações</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#494454] hover:text-[#0b1c30]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-2.5 my-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="p-3 rounded-2xl bg-[#eff4ff] border border-[#dce9ff] flex flex-col gap-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full ${n.bg} ${n.color} flex items-center justify-center shrink-0`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{n.icon}</span>
                  </div>
                  <span className="font-sora text-xs font-bold text-[#0b1c30]">{n.title}</span>
                </div>
                <span className="text-[10px] text-[#494454] font-outfit">{n.time}</span>
              </div>
              <p className="text-xs text-[#494454] font-outfit leading-snug pl-9">{n.desc}</p>
              {n.action && (
                <div className="pl-9 pt-0.5">
                  <button
                    onClick={n.action}
                    className="px-3 py-1 rounded-full bg-[#6b38d4] text-white text-[11px] font-outfit font-semibold hover:bg-[#8455ef] transition-colors"
                  >
                    {n.actionText}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full h-10 rounded-full bg-[#f8f9ff] text-xs font-outfit font-semibold text-[#494454] hover:bg-[#eff4ff] transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
