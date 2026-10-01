import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { errorMessage } from '../api/client';
import { DemoAccount, HOME_BY_ROLE, RegisterInput, Role, useSession } from '../auth/session';
import { PRICING, formatBRL } from '../config/pricing';
import { Logo } from '../components/Logo';

type Mode = 'login' | 'register';

const ROLES: { id: Role; label: string; icon: string }[] = [
  { id: 'employee', label: 'Sou funcionário', icon: 'badge' },
  { id: 'psychologist', label: 'Sou psicólogo', icon: 'clinical_notes' },
];

const PANEL: Record<Role, { title: string; text: string; icon: string }> = {
  employee: {
    title: 'Sua sessão de toda semana',
    text: 'Um psicólogo fixo, um horário que é seu e total sigilo. Sua empresa paga, mas nunca vê quem consulta.',
    icon: 'event_repeat',
  },
  psychologist: {
    title: 'Sua agenda, seus pacientes',
    text: `Atenda funcionários das empresas parceiras em horários recorrentes. ${formatBRL(PRICING.psychologistMonthly)} por mês, com repasse por sessão realizada.`,
    icon: 'calendar_month',
  },
};

const DEMO_ACCOUNTS: { id: DemoAccount; label: string; detail: string; icon: string }[] = [
  { id: 'employee', label: 'Funcionária', detail: 'Com sessão semanal marcada', icon: 'badge' },
  { id: 'new-employee', label: 'Primeiro acesso', detail: 'Ainda vai escolher o psicólogo', icon: 'person_search' },
  { id: 'psychologist', label: 'Psicóloga', detail: 'Agenda, pacientes e perfil', icon: 'clinical_notes' },
];

const FIELD_CLASS =
  'h-12 px-4 rounded-2xl bg-white border border-[#e5eeff] text-base text-[#0b1c30] placeholder:text-[#7b7486] focus:outline-none focus:border-[#6b38d4] focus:ring-2 focus:ring-[#6b38d4]/20';

const Field: React.FC<
  { id: string; label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>
> = ({ id, label, hint, ...input }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-semibold">
      {label}
    </label>
    <input id={id} required className={FIELD_CLASS} aria-describedby={hint ? `${id}-hint` : undefined} {...input} />
    {hint && (
      <span id={`${id}-hint`} className="text-xs text-[#7b7486]">
        {hint}
      </span>
    )}
  </div>
);

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, ready, login, register, loginDemo } = useSession();

  const [mode, setMode] = useState<Mode>(searchParams.get('criar') !== null ? 'register' : 'login');
  const [role, setRole] = useState<Role>(
    searchParams.get('perfil') === 'psicologo' ? 'psychologist' : 'employee'
  );
  const [form, setForm] = useState({ name: '', email: '', password: '', companyCode: '', reg: '', title: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in: go straight to the right area
  if (ready && session && !isSubmitting) return <Navigate to={HOME_BY_ROLE[session.role]} replace />;

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      let user;
      if (mode === 'login') {
        user = await login(form.email.trim(), form.password);
      } else {
        const base = { name: form.name.trim(), email: form.email.trim(), password: form.password };
        const input: RegisterInput =
          role === 'employee'
            ? { ...base, role, companyCode: form.companyCode.trim() }
            : { ...base, role, reg: form.reg.trim(), title: form.title.trim() };
        user = await register(input);
      }
      navigate(HOME_BY_ROLE[user.role], { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setIsSubmitting(false);
    }
  };

  const handleDemo = async (account: DemoAccount) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await loginDemo(account);
      navigate(HOME_BY_ROLE[user.role], { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setIsSubmitting(false);
    }
  };

  const isRegister = mode === 'register';

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] font-outfit grid lg:grid-cols-2">
      {/* Formulário */}
      <div className="flex flex-col px-4 sm:px-8 py-6">
        <Link to="/" className="self-start flex items-center gap-2.5 rounded-lg">
          <Logo variant="horizontal" size={40} />
        </Link>

        <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto my-auto py-10 flex flex-col gap-5">
          <div>
            <h1 className="font-sora text-2xl lg:text-3xl font-bold tracking-tight">
              {isRegister ? 'Crie sua conta' : 'Acesse sua conta'}
            </h1>
            <p className="text-base text-[#494454] mt-1">
              {isRegister ? 'Escolha como você vai usar o Synapse.' : 'Entre com o e-mail e a senha cadastrados.'}
            </p>
          </div>

          {isRegister && (
            <div role="radiogroup" aria-label="Perfil" className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#eff4ff]">
              {ROLES.map((option) => {
                const isSelected = role === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setRole(option.id);
                      setError(null);
                    }}
                    className={`h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected ? 'bg-white text-[#5516be] shadow-sm' : 'text-[#494454] hover:text-[#0b1c30]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}

          {isRegister && (
            <Field id="login-name" label="Nome completo" autoComplete="name" value={form.name} onChange={set('name')} maxLength={120} />
          )}

          <Field
            id="login-email"
            label="E-mail"
            type="email"
            autoComplete="email"
            autoFocus
            value={form.email}
            onChange={set('email')}
            placeholder={isRegister && role === 'employee' ? 'voce@empresa.com' : 'voce@email.com'}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-sm font-semibold">
              Senha
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={isRegister ? 8 : undefined}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={form.password}
                onChange={set('password')}
                aria-describedby={isRegister ? 'login-password-hint' : undefined}
                className={`${FIELD_CLASS} w-full pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute inset-y-0 right-1 my-auto w-10 h-10 rounded-full flex items-center justify-center text-[#494454] hover:bg-[#eff4ff]"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {isRegister && (
              <span id="login-password-hint" className="text-xs text-[#7b7486]">
                Pelo menos 8 caracteres.
              </span>
            )}
          </div>

          {isRegister && role === 'employee' && (
            <Field
              id="login-company"
              label="Código da empresa"
              hint="O RH da sua empresa informa esse código."
              autoComplete="off"
              value={form.companyCode}
              onChange={set('companyCode')}
              maxLength={40}
            />
          )}

          {isRegister && role === 'psychologist' && (
            <>
              <Field
                id="login-reg"
                label="Registro profissional (CRP)"
                placeholder="CRP 06/123456"
                autoComplete="off"
                value={form.reg}
                onChange={set('reg')}
                maxLength={40}
              />
              <Field
                id="login-title"
                label="Especialidade"
                placeholder="Psicóloga Clínica"
                hint="Seu perfil aparece para os funcionários depois que o registro for conferido."
                autoComplete="off"
                value={form.title}
                onChange={set('title')}
                maxLength={120}
              />
            </>
          )}

          {error && (
            <p role="alert" className="p-3 rounded-2xl bg-[#ffdad6]/60 text-sm text-[#93000a] flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100"
          >
            <span className={`material-symbols-outlined text-[20px] ${isSubmitting ? 'animate-spin' : ''}`}>
              {isSubmitting ? 'progress_activity' : 'login'}
            </span>
            {isSubmitting ? 'Aguarde...' : isRegister ? 'Criar conta' : 'Entrar'}
          </button>

          <p className="text-sm text-[#494454] text-center">
            {isRegister ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
            <button
              type="button"
              onClick={() => switchMode(isRegister ? 'login' : 'register')}
              className="font-semibold text-[#5516be] underline underline-offset-2 rounded"
            >
              {isRegister ? 'Entrar' : 'Criar conta'}
            </button>
          </p>

          {/* Acesso de demonstração */}
          {!isRegister && (
            <div className="flex flex-col gap-2 pt-5 border-t border-[#e5eeff]">
              <div>
                <h2 className="font-sora text-base font-bold">Só quer conhecer?</h2>
                <p className="text-sm text-[#494454]">Entre com uma conta de teste, sem senha.</p>
              </div>
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDemo(account.id)}
                  className="h-14 px-3 rounded-2xl bg-white border border-[#e5eeff] hover:border-[#6b38d4]/40 hover:bg-[#fbf9ff] text-left flex items-center gap-3 transition-colors disabled:opacity-60"
                >
                  <span className="w-9 h-9 rounded-full bg-[#e9ddff]/70 text-[#5516be] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">{account.icon}</span>
                  </span>
                  <span className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold text-[#0b1c30]">{account.label}</span>
                    <span className="text-xs text-[#494454] truncate">{account.detail}</span>
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-[#7b7486]">arrow_forward</span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Painel da marca */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-[#6b38d4] to-[#0051d5] text-white items-center justify-center p-12">
        <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-md text-center flex flex-col items-center gap-4">
          <span className="w-20 h-20 rounded-3xl bg-white/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-[44px]">{PANEL[role].icon}</span>
          </span>
          <h2 className="font-sora text-3xl font-bold tracking-tight">{PANEL[role].title}</h2>
          <p className="text-lg text-white/85 leading-relaxed">{PANEL[role].text}</p>
        </div>
      </div>
    </div>
  );
};
