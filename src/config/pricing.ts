/** Business rules of the plan. Every screen reads prices from here. */
export const PRICING = {
  /** What a company pays per covered employee, per month (R$) */
  companyPerEmployee: 200,
  /** Sessions each employee is entitled to */
  sessionsPerWeek: 1,
  /** What the platform pays the psychologist per completed session (R$) */
  sessionPayout: 50,
  /** Length of a session, in minutes */
  sessionMinutes: 50,
} as const;

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

export const formatBRL = (value: number) => brl.format(value);
