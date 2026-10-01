import React, { useCallback, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router';
import { Therapist } from '../../types';
import { useSession } from '../../auth/session';
import { AppShell, NavItem } from '../../components/AppShell';
import { HomeScreen } from '../../components/HomeScreen';
import { AssessmentScreen } from '../../components/AssessmentScreen';
import { TherapistsScreen } from '../../components/TherapistsScreen';
import { WellnessHubScreen } from '../../components/WellnessHubScreen';
import { SynapseAIScreen } from '../../components/SynapseAIScreen';
import { BreathingModal } from '../../components/BreathingModal';
import { SOSModal } from '../../components/SOSModal';
import { VideoRoomModal } from '../../components/VideoRoomModal';
import { ScheduleModal, ScheduleMode } from '../../components/ScheduleModal';
import { TherapistDetailModal } from '../../components/TherapistDetailModal';
import { NotificationsModal } from '../../components/NotificationsModal';
import { ProfileModal } from '../../components/ProfileModal';
import { EmployeePlanProvider, useEmployeePlan } from './plan';

const NAV_ITEMS: NavItem[] = [
  { to: '/app/inicio', label: 'Início', icon: 'grid_view' },
  { to: '/app/bem-estar', label: 'Bem-Estar', icon: 'spa' },
  { to: '/app/terapeutas', label: 'Terapeutas', icon: 'clinical_notes' },
  { to: '/app/synapse-ai', label: 'Synapse AI', icon: 'neurology', keepOutlined: true },
];

export const EmployeeApp: React.FC = () => (
  <EmployeePlanProvider>
    <EmployeeAppContent />
  </EmployeePlanProvider>
);

const EmployeeAppContent: React.FC = () => {
  const navigate = useNavigate();
  const { session, logout } = useSession();
  const { therapist: myTherapist } = useEmployeePlan();

  const [currentWellnessScore, setCurrentWellnessScore] = useState(84);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isDiscretionActive, setIsDiscretionActive] = useState(false);
  const [completedPractices, setCompletedPractices] = useState<string[]>([]);

  // Modals state
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [breathingTechnique, setBreathingTechnique] = useState<'478' | 'box'>('478');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isVideoRoomOpen, setIsVideoRoomOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scheduling, setScheduling] = useState<{ therapist: Therapist; mode: ScheduleMode } | null>(null);
  const [selectedTherapistProfile, setSelectedTherapistProfile] = useState<Therapist | null>(null);

  const goTo = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0 });
  };

  const handleOpenBreathing = (technique: '478' | 'box' = '478') => {
    setBreathingTechnique(technique);
    setIsBreathingOpen(true);
  };

  const markPracticeDone = useCallback((id: string) => {
    setCompletedPractices((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const handleBreathingComplete = useCallback(
    (technique: '478' | 'box') => markPracticeDone(`pacer-${technique}`),
    [markPracticeDone]
  );

  // Booking with the current therapist changes the fixed slot; with anyone else it switches therapist
  const openSchedule = (therapist: Therapist, mode: ScheduleMode = 'choose') =>
    setScheduling({ therapist, mode });

  const startAssessment = () => goTo('/app/check-in');
  const openSOS = () => setIsSOSOpen(true);

  const shell = (
    <AppShell
      navItems={NAV_ITEMS}
      user={{ name: session?.name ?? '' }}
      onOpenProfile={() => setIsProfileOpen(true)}
      onOpenNotifications={() => setIsNotificationsOpen(true)}
      unreadNotifications={hasCheckedInToday ? 1 : 2}
      headerBadge="Protegido pela LGPD"
      contentClassName={isDiscretionActive ? 'discretion-blur' : ''}
      sidebarFooter={
        <>
          <button
            onClick={openSOS}
            className="h-11 px-3 rounded-xl bg-[#ffdad6]/60 hover:bg-[#ffdad6] text-[#ba1a1a] font-outfit text-sm font-semibold flex items-center gap-3 transition-colors"
          >
            <span className="material-symbols-outlined text-[22px] fill-1">shield_with_heart</span>
            <span>SOS Acolhimento</span>
          </button>

          <div className="p-3 rounded-xl bg-[#eff4ff] flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#0051d5] fill-1 shrink-0">
              verified_user
            </span>
            <p className="font-outfit text-xs text-[#494454] leading-snug">
              <strong className="text-[#003ea8] font-semibold">100% anônimo.</strong> Sua empresa nunca vê seus dados individuais.
            </p>
          </div>
        </>
      }
    >
      <Outlet />
    </AppShell>
  );

  return (
    <>
      {/* Discretion Shade Full-Screen Overlay (if active) */}
      {isDiscretionActive && (
        <button
          type="button"
          onClick={() => setIsDiscretionActive(false)}
          aria-label="Restaurar visualização"
          autoFocus
          className="fixed inset-0 z-50 w-full bg-[#0b1c30]/25 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-fade-in font-outfit"
        >
          <span className="bg-white/95 rounded-3xl p-6 shadow-2xl max-w-sm border border-white/60 flex flex-col items-center gap-2">
            <span className="w-12 h-12 rounded-full bg-[#eff4ff] text-[#6b38d4] flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">visibility_off</span>
            </span>
            <span className="font-sora text-base font-bold text-[#0b1c30]">Modo discreto ativo</span>
            <span className="text-sm text-[#494454]">
              Seus dados de saúde mental foram ocultados da tela. Toque em qualquer lugar para voltar.
            </span>
            <span className="mt-2 px-4 py-2 rounded-full bg-[#6b38d4] text-white text-sm font-semibold">
              Restaurar visualização
            </span>
          </span>
        </button>
      )}

      <Routes>
        <Route
          path="check-in"
          element={
            <AssessmentScreen
              onBack={() => goTo('/app/inicio')}
              onOpenSOS={openSOS}
              onFinish={(newScore) => {
                setCurrentWellnessScore(newScore);
                setHasCheckedInToday(true);
                goTo('/app/inicio');
              }}
            />
          }
        />

        <Route element={shell}>
          <Route
            path="inicio"
            element={
              <HomeScreen
                onStartAssessment={startAssessment}
                onOpenBreathing={handleOpenBreathing}
                onOpenSOS={openSOS}
                onOpenVideoRoom={() => setIsVideoRoomOpen(true)}
                onOpenTherapistProfile={() => setSelectedTherapistProfile(myTherapist)}
                onReschedule={() => myTherapist && openSchedule(myTherapist, 'reschedule')}
                onFindTherapist={() => goTo('/app/terapeutas')}
                onToggleDiscretion={() => setIsDiscretionActive(true)}
                currentWellnessScore={currentWellnessScore}
                hasCheckedInToday={hasCheckedInToday}
              />
            }
          />
          <Route
            path="bem-estar"
            element={
              <WellnessHubScreen
                onOpenBreathing={handleOpenBreathing}
                onOpenSOS={openSOS}
                onOpenSchedule={() => goTo('/app/terapeutas')}
                completedPractices={completedPractices}
                onPracticeDone={markPracticeDone}
              />
            }
          />
          <Route
            path="terapeutas"
            element={
              <TherapistsScreen
                onSchedule={openSchedule}
                onViewProfile={(th) => setSelectedTherapistProfile(th)}
              />
            }
          />
          <Route
            path="synapse-ai"
            element={
              <SynapseAIScreen
                currentWellnessScore={currentWellnessScore}
                hasCheckedInToday={hasCheckedInToday}
                onStartAssessment={startAssessment}
                onOpenBreathing={handleOpenBreathing}
                onFindTherapist={() => goTo('/app/terapeutas')}
                onOpenWellness={() => goTo('/app/bem-estar')}
              />
            }
          />
          <Route path="*" element={<Navigate to="/app/inicio" replace />} />
        </Route>
      </Routes>

      {/* Interactive Modals */}
      <BreathingModal
        isOpen={isBreathingOpen}
        onClose={() => setIsBreathingOpen(false)}
        technique={breathingTechnique}
        onComplete={handleBreathingComplete}
      />

      <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />

      <VideoRoomModal
        isOpen={isVideoRoomOpen && myTherapist !== null}
        onClose={() => setIsVideoRoomOpen(false)}
        remoteName={myTherapist?.name ?? ''}
        remoteRole={myTherapist?.title ?? ''}
        remoteImage={myTherapist?.avatar ?? undefined}
      />

      <ScheduleModal
        isOpen={scheduling !== null}
        therapist={scheduling?.therapist ?? null}
        mode={scheduling?.mode ?? 'choose'}
        onClose={() => setScheduling(null)}
      />

      <TherapistDetailModal
        isOpen={selectedTherapistProfile !== null}
        therapist={selectedTherapistProfile}
        isCurrent={selectedTherapistProfile !== null && selectedTherapistProfile.id === myTherapist?.id}
        onClose={() => setSelectedTherapistProfile(null)}
        onSchedule={(th) => {
          setSelectedTherapistProfile(null);
          openSchedule(th);
        }}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        hasCheckedInToday={hasCheckedInToday}
        onOpenSession={() => setIsVideoRoomOpen(true)}
        onFindTherapist={() => goTo('/app/terapeutas')}
        onOpenAssessment={startAssessment}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onToggleDiscretion={() => setIsDiscretionActive(true)}
        onLogout={logout}
      />
    </>
  );
};
