import React, { useState } from 'react';
import { errorMessage } from '../api/client';
import { useSession } from '../auth/session';
import { TermsContent } from '../legal/terms';
import { Logo } from './Logo';
import { Acceptance, TermsAcceptance, isAcceptanceComplete } from './TermsAcceptance';

/**
 * First-access screen for accounts that have not accepted the current terms: the app only
 * opens after the acceptance is recorded by the API.
 */
export const TermsGate: React.FC = () => {
  const { session, acceptTerms, logout } = useSession();
  const [acceptance, setAcceptance] = useState<Acceptance>({ terms: false, healthData: false });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) return null;

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await acceptTerms(acceptance);
    } catch (err) {
      setError(errorMessage(err));
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] font-outfit flex flex-col items-center px-4 py-6">
      <Logo variant="horizontal" size={40} />

      <form onSubmit={handleAccept} className="card w-full max-w-2xl mt-6 flex flex-col gap-4">
        <div>
          <span className="font-outfit text-xs font-bold uppercase tracking-wider text-[#6b38d4]">LGPD</span>
          <h1 className="font-sora text-xl lg:text-2xl font-bold tracking-tight">Termo de Aceite e Privacidade</h1>
          <p className="text-sm text-[#494454] mt-1">
            Antes de continuar, {session.name.replace(/^Dra?\.\s*/, '').split(' ')[0]}, leia como o Synapse trata os
            seus dados.
          </p>
        </div>

        <div
          tabIndex={0}
          aria-label="Texto do termo"
          className="max-h-[45vh] overflow-y-auto p-4 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff]"
        >
          <TermsContent />
        </div>

        <TermsAcceptance role={session.role} value={acceptance} onChange={setAcceptance} />

        {error && (
          <p role="alert" className="p-3 rounded-2xl bg-[#ffdad6]/60 text-sm text-[#93000a]">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <button
            type="button"
            onClick={logout}
            className="h-12 px-6 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] text-sm font-semibold transition-colors"
          >
            Não aceito, sair
          </button>
          <button
            type="submit"
            disabled={isSaving || !isAcceptanceComplete(acceptance, session.role)}
            className="flex-1 h-12 min-h-12 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white text-sm font-bold transition-colors disabled:bg-[#cbc3d7]"
          >
            {isSaving ? 'Registrando...' : 'Aceitar e continuar'}
          </button>
        </div>
      </form>
    </div>
  );
};
