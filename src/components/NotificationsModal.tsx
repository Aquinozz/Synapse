import React from 'react';
import { Modal, ModalCloseButton } from './Modal';
import { useEmployeePlan } from '../areas/employee/plan';
import { formatCountdown, formatDayTime, isSameDay } from '../utils/schedule';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasCheckedInToday: boolean;
  onOpenSession: () => void;
  onFindTherapist: () => void;
  onOpenAssessment: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  hasCheckedInToday,
  onOpenSession,
  onFindTherapist,
  onOpenAssessment,
}) => {
  const { therapist, next, now } = useEmployeePlan();
  const isToday = next !== null && isSameDay(next, now);

  const notifications: {
    id: string;
    title: string;
    desc: string;
    time: string;
    icon: string;
    color: string;
    bg: string;
    action?: () => void;
    actionText?: string;
  }[] = [
    therapist && next
      ? {
          id: '1',
          title: isToday ? `Sessão ${formatCountdown(next, now)}` : 'Sua próxima sessão',
          desc: `Sessão semanal com ${therapist.name}: ${formatDayTime(next, now).toLowerCase()}.`,
          time: isToday ? 'Hoje' : formatCountdown(next, now),
          icon: 'video_camera_front',
          color: 'text-[#6b38d4]',
          bg: 'bg-[#e9ddff]',
          ...(isToday && {
            action: () => {
              onClose();
              onOpenSession();
            },
            actionText: 'Entrar na sala',
          }),
        }
      : {
          id: '1',
          title: 'Escolha seu psicólogo',
          desc: 'Você ainda não definiu o profissional e o horário da sua sessão semanal.',
          time: 'Pendente',
          icon: 'person_search',
          color: 'text-[#6b38d4]',
          bg: 'bg-[#e9ddff]',
          action: () => {
            onClose();
            onFindTherapist();
          },
          actionText: 'Ver psicólogos',
        },
    {
      id: '2',
      title: hasCheckedInToday ? 'Check-in de hoje concluído' : 'Check-in diário disponível',
      desc: hasCheckedInToday
        ? 'Suas respostas foram registradas de forma anônima.'
        : 'Cinco perguntas rápidas sobre o seu dia (2 min).',
      time: 'Hoje',
      icon: 'fact_check',
      color: 'text-[#0051d5]',
      bg: 'bg-[#dbe1ff]',
      ...(!hasCheckedInToday && {
        action: () => {
          onClose();
          onOpenAssessment();
        },
        actionText: 'Fazer check-in',
      }),
    },
    {
      id: '3',
      title: 'Plano ativo',
      desc: 'Seu plano cobre 1 sessão por semana com o seu psicólogo, paga pela sua empresa.',
      time: 'Esta semana',
      icon: 'verified',
      color: 'text-[#00855b]',
      bg: 'bg-[#6ffbbe]/30',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} label="Notificações" maxWidth="max-w-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#6b38d4]">notifications</span>
            <h3 className="font-sora text-base font-bold text-[#0b1c30]">Notificações</h3>
          </div>
          <ModalCloseButton onClose={onClose} />
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
                    className="px-4 py-2 rounded-full bg-[#6b38d4] text-white text-xs font-outfit font-semibold hover:bg-[#8455ef] transition-colors"
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
          className="w-full h-11 shrink-0 rounded-full bg-[#f8f9ff] text-xs font-outfit font-semibold text-[#494454] hover:bg-[#eff4ff] transition-colors"
        >
          Fechar
        </button>
    </Modal>
  );
};
