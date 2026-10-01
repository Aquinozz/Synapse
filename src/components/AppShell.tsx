import React, { useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { Logo } from './Logo';
import { AccessibilityButton } from './AccessibilityButton';
import { Avatar } from './Avatar';
import { scrollPageToTop } from '../utils/scroll';

export interface NavItem {
  to: string;
  label: string;
  icon: string;
  /** Some icons turn into a blob when filled; those stay outlined when active */
  keepOutlined?: boolean;
}

interface AppShellProps {
  navItems: NavItem[];
  user: { name: string; image?: string | null };
  onOpenProfile: () => void;
  onOpenNotifications?: () => void;
  unreadNotifications?: number;
  /** Short reassurance shown in the header from `sm` up */
  headerBadge?: string;
  /** Bottom of the desktop sidebar */
  sidebarFooter?: React.ReactNode;
  contentClassName?: string;
  children: React.ReactNode;
}

/**
 * Frame shared by the signed-in areas: sidebar on desktop, bottom tab bar on
 * phones and tablets, and a top header with the current section's name.
 */
export const AppShell: React.FC<AppShellProps> = ({
  navItems,
  user,
  onOpenProfile,
  onOpenNotifications,
  unreadNotifications = 0,
  headerBadge,
  sidebarFooter,
  contentClassName = '',
  children,
}) => {
  const { pathname } = useLocation();
  // Each section opens at its top, whichever way it was reached
  useEffect(() => {
    scrollPageToTop();
  }, [pathname]);

  const title = navItems.find((item) => pathname.startsWith(item.to))?.label ?? 'Synapse';
  const firstName = user.name.replace(/^Dra?\.\s*/, '').split(' ')[0];

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col relative font-outfit">
      {/* Desktop: fixed sidebar */}
      <aside className="no-print hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col bg-white border-r border-[#e5eeff]">
        <Link
          to="/"
          aria-label="Synapse: voltar à página inicial"
          className="h-16 px-6 flex items-center gap-2.5 shrink-0 rounded-xl"
        >
          <Logo variant="horizontal" size={40} />
        </Link>

        <nav aria-label="Navegação principal" className="flex-1 flex flex-col gap-1 px-3 pt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `h-11 px-3 rounded-xl flex items-center gap-3 font-outfit text-sm transition-colors ${
                  isActive
                    ? 'bg-[#e9ddff]/70 text-[#5516be] font-semibold'
                    : 'text-[#494454] font-medium hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`material-symbols-outlined text-[1.5rem] ${
                      isActive && !item.keepOutlined ? 'fill-1' : ''
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {sidebarFooter && <div className="p-3 flex flex-col gap-3">{sidebarFooter}</div>}
      </aside>

      {/* Top header */}
      <header className="no-print fixed top-0 inset-x-0 lg:left-64 z-30 bg-[#f8f9ff]/85 backdrop-blur-xl border-b border-black/[0.04] pt-[env(safe-area-inset-top,0px)]">
        <div className="h-16 max-w-md md:max-w-2xl lg:max-w-6xl mx-auto px-4 lg:px-8 flex items-center justify-between gap-2">
          {/* Brand on mobile, section title on desktop (brand lives in the sidebar) */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link to="/" aria-label="Synapse: voltar à página inicial" className="lg:hidden rounded-lg shrink-0">
              <Logo size={32} />
            </Link>
            <div className="flex flex-col min-w-0">
              <Link
                to="/"
                tabIndex={-1}
                aria-hidden="true"
                className="lg:hidden font-sora text-2xs font-bold text-[#6b38d4] tracking-wide uppercase leading-tight"
              >
                Synapse
              </Link>
              <span className="font-sora text-lg lg:text-xl font-bold text-[#0b1c30] tracking-tight leading-tight truncate">
                {title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {headerBadge && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 mr-1 rounded-full bg-[#dbe1ff]/60">
                <span className="material-symbols-outlined text-[1rem] text-[#003ea8]">shield_lock</span>
                <span className="font-outfit text-2xs leading-none text-[#003ea8] tracking-wide font-semibold">
                  {headerBadge}
                </span>
              </div>
            )}

            <AccessibilityButton />

            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                aria-label={
                  unreadNotifications > 0
                    ? `Notificações (${unreadNotifications} não lida${unreadNotifications > 1 ? 's' : ''})`
                    : 'Notificações'
                }
                className="w-11 h-11 rounded-full flex items-center justify-center text-[#494454] hover:bg-[#e5eeff] active:bg-[#dce9ff] transition-colors relative"
              >
                <span className="material-symbols-outlined text-[1.5rem]">notifications</span>
                {unreadNotifications > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#8455ef] ring-2 ring-[#f8f9ff]" />
                )}
              </button>
            )}

            <button
              onClick={onOpenProfile}
              aria-label={`Abrir perfil de ${firstName}`}
              className="h-11 pl-1.5 pr-1.5 lg:pr-3 flex items-center gap-2 rounded-full hover:bg-[#e5eeff] transition-colors"
            >
              <Avatar name={user.name} image={user.image} className="w-8 h-8 text-xs" />
              <span className="hidden lg:inline font-outfit text-sm font-semibold text-[#0b1c30]">
                {firstName}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main
        key={pathname}
        className={`flex-1 flex flex-col w-full lg:pl-64 animate-screen-in ${contentClassName}`}
      >
        {children}
      </main>

      {/* Mobile and tablet: bottom tab bar */}
      <nav
        aria-label="Navegação principal"
        className="no-print lg:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom,0px)] bg-[#f8f9ff]/90 backdrop-blur-xl border-t border-black/[0.04] shadow-[0_-2px_12px_rgba(15,23,42,0.04)]"
      >
        <div className="max-w-md md:max-w-2xl mx-auto flex justify-around items-center h-16 px-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full min-w-[44px] rounded-xl transition-colors duration-200 ${
                  isActive ? 'text-[#6b38d4]' : 'text-[#494454] hover:text-[#0b1c30]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`px-4 py-0.5 rounded-full transition-colors flex ${isActive ? 'bg-[#e9ddff]' : ''}`}>
                    <span
                      className={`material-symbols-outlined text-[1.6875rem] ${
                        isActive && !item.keepOutlined ? 'fill-1' : ''
                      }`}
                    >
                      {item.icon}
                    </span>
                  </span>
                  <span
                    className={`font-outfit text-[length:min(var(--text-2xs),0.875rem)] leading-tight mt-0.5 tracking-tight ${
                      isActive ? 'font-bold' : 'font-medium'
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
