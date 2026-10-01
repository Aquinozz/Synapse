import React from 'react';
import { ManagementKPIs } from '../types';
import { Modal, ModalCloseButton } from './Modal';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpis: ManagementKPIs;
  departmentName: string;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  kpis,
  departmentName,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      label="Relatório executivo"
      maxWidth="max-w-2xl"
      className="print-area sm:!p-8"
      dimmed
    >
        {/* Actions header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#eff4ff]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[24px] text-[#6b38d4]">
              picture_as_pdf
            </span>
            <div>
              <span className="font-outfit text-xs font-bold uppercase tracking-wider text-[#6b38d4]">
                Relatório Executivo Auditado
              </span>
              <h3 className="font-sora text-lg font-bold text-[#0b1c30]">
                Resiliência & Saúde Psicossocial {new Date().getFullYear()}
              </h3>
            </div>
          </div>
          <ModalCloseButton onClose={onClose} className="no-print" />
        </div>

        {/* Report Content */}
        <div className="my-4 space-y-4 text-xs font-outfit text-[#494454]">
          <div className="p-4 rounded-2xl bg-[#eff4ff] flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[11px] text-[#494454] uppercase tracking-wider font-semibold">
                Escopo Selecionado
              </div>
              <div className="font-sora text-base font-bold text-[#0b1c30]">
                {departmentName}
              </div>
              <div className="text-[11px] text-[#0051d5]">
                {kpis.totalEmployees} colaboradores protegidos · Base anonimizada
              </div>
            </div>
            <div className="sm:text-right">
              <span className="inline-block px-2.5 py-1 rounded-full bg-[#6ffbbe]/40 text-[#002113] font-bold text-[10px] uppercase">
                Certificação ESG / CIPA
              </span>
              <div className="text-[10px] text-[#494454] mt-1">
                Data de emissão: {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#f8f9ff] rounded-2xl border border-[#e5eeff]">
              <span className="text-[10px] uppercase font-bold text-[#494454]">Índice de Bem-Estar</span>
              <div className="font-sora text-2xl font-bold text-[#0b1c30] mt-1">
                {kpis.wellnessIndex}/100
              </div>
              <span className={`font-semibold text-[11px] ${kpis.wellnessDelta.startsWith('-') ? 'text-[#ba1a1a]' : 'text-[#00855b]'}`}>{kpis.wellnessDelta}</span>
            </div>
            <div className="p-3 bg-[#f8f9ff] rounded-2xl border border-[#e5eeff]">
              <span className="text-[10px] uppercase font-bold text-[#494454]">Adesão aos Cuidados</span>
              <div className="font-sora text-2xl font-bold text-[#0b1c30] mt-1">
                {kpis.activeAdoptionPct}%
              </div>
              <span className="text-[#0051d5] font-semibold text-[11px]">{kpis.activeMembers} membros ativos</span>
            </div>
            <div className="p-3 bg-[#f8f9ff] rounded-2xl border border-[#e5eeff]">
              <span className="text-[10px] uppercase font-bold text-[#494454]">Risco de Burnout</span>
              <div className="font-sora text-2xl font-bold text-[#6b38d4] mt-1">
                {kpis.burnoutRiskPct}%
              </div>
              <span className={`font-semibold text-[11px] ${kpis.burnoutDelta.startsWith('+') ? 'text-[#ba1a1a]' : 'text-[#00855b]'}`}>{kpis.burnoutDelta}</span>
            </div>
            <div className="p-3 bg-[#f8f9ff] rounded-2xl border border-[#e5eeff]">
              <span className="text-[10px] uppercase font-bold text-[#494454]">Retorno Financeiro</span>
              <div className="font-sora text-xl font-bold text-[#00855b] mt-1">
                {kpis.savingsRoi}
              </div>
              <span className="text-[#494454] text-[10px]">Economia em turnover</span>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h4 className="font-sora text-sm font-bold text-[#0b1c30]">
              1. Parecer Executivo & Compliance Psicossocial
            </h4>
            <p className="leading-relaxed">
              O ecossistema Synapse registrou redução de <strong>{kpis.leaveReductionPct}%</strong> em pedidos de licença médica por estresse ocupacional e transtornos de humor no período auditado. A taxa de confidencialidade absoluta manteve-se em 100%, sem nenhum vazamento ou desanonimização de prontuários individuais.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-sora text-sm font-bold text-[#0b1c30]">
              2. Recomendações Estruturantes para a Diretoria
            </h4>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed">
              <li>
                <strong>Manter política de "No-Meeting Friday"</strong> em equipes comerciais com carga de reuniões acima de 24 horas semanais.
              </li>
              <li>
                <strong>Expansão dos créditos de telepsicologia</strong> para o time de suporte e atendimento de nível 1 antes do fechamento do trimestre.
              </li>
              <li>
                <strong>Continuidade das pausas somáticas integradas</strong> aos mensageiros internos (Slack/Teams).
              </li>
            </ul>
          </div>

          {/* Signatures */}
          <div className="pt-4 border-t border-[#eff4ff] flex items-center justify-between gap-3 flex-wrap text-[11px] text-[#494454]">
            <div>
              <span className="font-bold text-[#0b1c30]">Auditoria de Riscos Psicossociais</span>
              <div>Conselho Consultivo Synapse & Especialistas CRP/CRM</div>
            </div>
            <div className="flex items-center gap-1.5 text-[#00855b] font-semibold">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>Assinatura Digital Válida ICP-Brasil</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="no-print flex flex-col-reverse sm:flex-row gap-2 mt-2 shrink-0">
          <button
            onClick={onClose}
            className="h-11 px-6 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-outfit text-sm font-semibold transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 h-11 min-h-11 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
    </Modal>
  );
};
