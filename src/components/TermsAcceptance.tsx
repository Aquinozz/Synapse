import React from 'react';
import { Role } from '../auth/session';

export interface Acceptance {
  terms: boolean;
  /** Separate, explicit consent to the processing of health data (employees only) */
  healthData: boolean;
}

export const isAcceptanceComplete = (acceptance: Acceptance, role: Role) =>
  acceptance.terms && (role !== 'employee' || acceptance.healthData);

interface TermsAcceptanceProps {
  role: Role;
  value: Acceptance;
  onChange: (value: Acceptance) => void;
  /** Opens the full text; omitted where the text is already on screen */
  onReadTerms?: () => void;
}

const BOX_CLASS = 'mt-0.5 w-5 h-5 shrink-0 accent-[#6b38d4]';

/**
 * The acceptance checkboxes, shared by the sign-up form and the first-access screen.
 * The health-data consent is its own, highlighted checkbox: the LGPD (art. 11, I) asks for
 * consent to sensitive data to be specific and set apart from the rest.
 */
export const TermsAcceptance: React.FC<TermsAcceptanceProps> = ({ role, value, onChange, onReadTerms }) => (
  <div className="flex flex-col gap-2 font-outfit text-sm text-[#494454]">
    <label className="flex items-start gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        checked={value.terms}
        onChange={(e) => onChange({ ...value, terms: e.target.checked })}
        className={BOX_CLASS}
      />
      <span>
        Li e aceito o{' '}
        {onReadTerms ? (
          <button
            type="button"
            onClick={onReadTerms}
            className="font-semibold text-[#5516be] underline underline-offset-2 rounded"
          >
            Termo de Aceite e Privacidade
          </button>
        ) : (
          <strong className="text-[#0b1c30] font-semibold">Termo de Aceite e Privacidade</strong>
        )}
        .
      </span>
    </label>

    {role === 'employee' && (
      <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-2xl bg-[#eff4ff] border border-[#dce9ff]">
        <input
          type="checkbox"
          checked={value.healthData}
          onChange={(e) => onChange({ ...value, healthData: e.target.checked })}
          className={BOX_CLASS}
        />
        <span>
          <strong className="text-[#0b1c30] font-semibold">Autorizo o tratamento dos meus dados de saúde</strong> (o
          psicólogo escolhido e os horários das sessões) apenas para agendar e realizar as minhas sessões. Posso revogar
          esta autorização quando quiser.
        </span>
      </label>
    )}
  </div>
);
