import React from 'react';
import { Logo } from './Logo';
import { IMAGES } from '../constants/images';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  unreadNotifications?: number;
  privacyShieldText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Synapse',
  subtitle,
  showBack = false,
  onBack,
  onOpenNotifications,
  onOpenProfile,
  unreadNotifications = 1,
  privacyShieldText = 'LGPD Blindado',
}) => {
  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#f8f9ff]/85 backdrop-blur-xl border-b border-black/[0.04] shadow-[0_1px_8px_rgba(0,0,0,0.03)] pt-[env(safe-area-inset-top,0px)]">
      <div className="h-16 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 flex items-center justify-between gap-2">
        {/* Left Section */}
        <div className="flex items-center gap-2 min-w-0">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              aria-label="Voltar"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#0b1c30] hover:bg-[#e5eeff] active:bg-[#dce9ff] transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          ) : null}

          <div className="flex items-center gap-2 min-w-0">
            <Logo size={32} />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-sora text-[19px] font-bold text-[#6b38d4] tracking-tight leading-tight">
                  {title}
                </span>
                {subtitle && (
                  <span className="text-[13px] text-[#494454] font-medium truncate hidden xs:inline">
                    {subtitle}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#dbe1ff]/60 w-max">
                <span className="material-symbols-outlined text-[11px] text-[#003ea8] font-bold">
                  shield_lock
                </span>
                <span className="font-outfit text-[10px] leading-none text-[#003ea8] tracking-wider font-semibold uppercase">
                  {privacyShieldText}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNotifications}
            aria-label="Notificações"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#494454] hover:bg-[#e5eeff] active:bg-[#dce9ff] transition-colors relative"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadNotifications > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#8455ef] ring-2 ring-[#f8f9ff]" />
            )}
          </button>

          <button
            onClick={onOpenProfile}
            aria-label="Perfil do Usuário"
            className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:ring-2 hover:ring-[#6b38d4]/30 transition-all"
          >
            <img
              src={IMAGES.userMarina}
              alt="Marina - Perfil"
              className="w-8 h-8 rounded-full object-cover shadow-[0_2px_8px_-2px_rgba(15,23,42,0.12)] border border-white"
              onError={(e) => {
                // fallback avatar
                e.currentTarget.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&h=120&q=80";
              }}
            />
            <span
              className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#006947] ring-2 ring-[#f8f9ff]"
              title="Status: Equilibrado"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
