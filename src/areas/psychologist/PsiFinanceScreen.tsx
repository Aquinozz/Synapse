import React from 'react';
import { PRICING, formatBRL } from '../../config/pricing';
import { Patient, countSessionsHeld } from '../../data/psychologistMock';
import { countWeekdayBetween, startOfMonth, useNow } from '../../utils/schedule';

interface PsiFinanceScreenProps {
  patients: Patient[];
}

const monthName = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

/**
 * Estimates from the weekly agenda. The API does not record completed sessions,
 * or payouts yet, so nothing here is a payment record.
 */
export const PsiFinanceScreen: React.FC<PsiFinanceScreenProps> = ({ patients }) => {
  const now = useNow(60000);

  const monthStart = startOfMonth(now);
  const nextMonthStart = startOfMonth(now, 1);
  const done = countSessionsHeld(patients, monthStart, now);
  // Sessions still to come this month, one per patient per week
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const scheduled =
    done +
    patients.reduce((total, p) => {
      const upcoming = countWeekdayBetween(p.weekday, todayStart, nextMonthStart);
      const todayIsCounted = p.weekday === now.getDay() && countSessionsHeld([p], todayStart, now) === 1;
      return total + upcoming - (todayIsCounted ? 1 : 0);
    }, 0);

  return (
    <div className="screen">
      <section className="flex flex-col">
        <h1 className="font-sora text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight">Financeiro</h1>
        <p className="font-outfit text-sm lg:text-base text-[#494454]">
          Estimativa de repasse pela sua agenda.
        </p>
      </section>

      <div className="flex flex-col gap-4 lg:gap-6 max-w-3xl">
        <section className="rounded-3xl p-5 lg:p-6 bg-gradient-to-br from-[#6b38d4] to-[#0051d5] text-white relative overflow-hidden">
          <div className="absolute -right-12 -bottom-16 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex flex-col gap-1">
            <span className="font-outfit text-sm font-semibold text-[#dbe1ff]">
              Repasse estimado em {monthName(now)}
            </span>
            <span className="font-sora text-4xl lg:text-5xl font-bold tracking-tight tabular-nums">
              {formatBRL(done * PRICING.sessionPayout)}
            </span>
            <span className="font-outfit text-sm text-white/85">
              {done} {done === 1 ? 'sessão' : 'sessões'} até agora × {formatBRL(PRICING.sessionPayout)} por sessão
            </span>
          </div>

          <div className="relative grid grid-cols-2 gap-3 mt-5">
            <div className="p-3 rounded-2xl bg-white/15">
              <div className="font-outfit text-xs text-white/80">Previsto até o fim do mês</div>
              <div className="font-sora text-lg font-bold tabular-nums">
                {formatBRL(scheduled * PRICING.sessionPayout)}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-white/15">
              <div className="font-outfit text-xs text-white/80">Sessões na agenda do mês</div>
              <div className="font-sora text-lg font-bold tabular-nums">{scheduled}</div>
            </div>
          </div>
        </section>

        <aside className="rounded-3xl p-4 bg-[#eff4ff] border border-[#dce9ff] flex items-start gap-3">
          <span className="material-symbols-outlined text-[1.375rem] text-[#0051d5] shrink-0">info</span>
          <p className="font-outfit text-sm text-[#494454] leading-snug">
            Os valores são calculados pelos horários fixos dos seus pacientes. O extrato com as sessões realizadas e os pagamentos ainda não está disponível.
          </p>
        </aside>
      </div>
    </div>
  );
};
