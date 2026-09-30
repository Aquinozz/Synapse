import React, { useState } from 'react';
import { Therapist } from '../types';
import { sound } from '../utils/audio';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapist: Therapist | null;
  onBookSuccess?: (appointmentInfo: { therapist: Therapist; slot: string; format: string }) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  therapist,
  onBookSuccess,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'video' | 'audio'>('video');
  const [selectedSlot, setSelectedSlot] = useState<string>('Hoje • 16:30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  if (!isOpen || !therapist) return null;

  const slots = [
    'Hoje • 16:30',
    'Amanhã • 10:00',
    'Amanhã • 15:30',
    'Quinta • 14:00',
  ];

  const handleConfirm = () => {
    setIsSubmitting(true);
    sound.playChime('click');
    setTimeout(() => {
      setIsSubmitting(false);
      setIsBooked(true);
      sound.playChime('success');
      if (onBookSuccess) {
        onBookSuccess({
          therapist,
          slot: selectedSlot,
          format: selectedFormat === 'video' ? 'Vídeo HD Segura' : 'Apenas Áudio',
        });
      }
    }, 1200);
  };

  const handleFinish = () => {
    setIsBooked(false);
    onClose();
  };

  return (
    <div
      aria-labelledby="modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#213145]/40 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-4 transition-opacity duration-300"
      role="dialog"
    >
      <div className="bg-[#ffffff] rounded-3xl p-6 flex flex-col gap-4 shadow-2xl max-w-lg mx-auto w-full border border-white">
        {isBooked ? (
          <div className="flex flex-col items-center text-center py-4 gap-3">
            <div className="w-16 h-16 rounded-full bg-[#f5fff6] text-[#00855b] flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[36px] fill-1">check_circle</span>
            </div>
            <div>
              <span className="font-outfit text-xs font-bold uppercase tracking-wider text-[#00855b]">
                Agendamento Confirmado
              </span>
              <h3 className="font-sora text-xl font-bold text-[#0b1c30] mt-1">
                Consulta com {therapist.name}
              </h3>
              <p className="font-outfit text-sm text-[#494454] mt-1">
                Horário reservado: <strong>{selectedSlot}</strong> via {selectedFormat === 'video' ? 'Vídeo HD Criptografado' : 'Áudio Seguro'}.
              </p>
            </div>

            <div className="w-full p-3 rounded-2xl bg-[#eff4ff] text-left text-xs text-[#0b1c30] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#0051d5]">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Benefício Corporativo Aplicado</span>
              </div>
              <p className="text-[#494454]">
                100% subsidiado pela empresa. Nenhum dado de motivo ou histórico clínico é compartilhado.
              </p>
            </div>

            <button
              onClick={handleFinish}
              className="w-full h-12 rounded-full bg-[#6b38d4] text-white font-outfit text-sm font-bold shadow-md hover:bg-[#8455ef] transition-colors"
            >
              Concluir & Retornar
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex flex-col">
                <span className="font-outfit text-xs text-[#6b38d4] font-bold uppercase tracking-wider">
                  Agendamento de Consulta
                </span>
                <h4 className="font-sora text-lg font-bold text-[#0b1c30]">
                  {therapist.name}
                </h4>
                <span className="text-xs text-[#494454] font-outfit">
                  {therapist.reg} · {therapist.title}
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar janela"
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#494454] hover:bg-[#e5eeff]"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Modality Format */}
            <div className="flex flex-col gap-1.5">
              <label className="font-outfit text-xs text-[#494454] font-medium">
                Selecione o formato de consulta:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFormat('video')}
                  className={`h-11 rounded-2xl font-outfit text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    selectedFormat === 'video'
                      ? 'bg-[#e9ddff] text-[#23005c] border border-[#6b38d4]/30 shadow-xs'
                      : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#e5eeff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">videocam</span>
                  <span>Vídeo HD Segura</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFormat('audio')}
                  className={`h-11 rounded-2xl font-outfit text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    selectedFormat === 'audio'
                      ? 'bg-[#e9ddff] text-[#23005c] border border-[#6b38d4]/30 shadow-xs'
                      : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#e5eeff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  <span>Apenas Áudio</span>
                </button>
              </div>
            </div>

            {/* Suggested Slots */}
            <div className="flex flex-col gap-1.5">
              <label className="font-outfit text-xs text-[#494454] font-medium">
                Horários sugeridos mais próximos:
              </label>
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-3.5 py-2 rounded-full font-outfit text-xs font-semibold transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-[#6b38d4] text-white shadow-xs'
                          : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#e5eeff]'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Corporate Benefit Status */}
            <div className="p-3 bg-[#6ffbbe]/25 rounded-2xl flex items-center gap-2 text-[#002113] font-outfit text-xs">
              <span className="material-symbols-outlined text-[18px] text-[#006947] shrink-0">
                check_circle
              </span>
              <span>Sessão 100% gratuita. 3 de 4 créditos restantes no mês.</span>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="h-12 w-full rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    progress_activity
                  </span>
                  <span>Validando Criptografia e Vaga...</span>
                </>
              ) : (
                <>
                  <span>Confirmar Agendamento Seguro</span>
                  <span className="material-symbols-outlined text-[20px]">check</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
