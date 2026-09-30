import React, { useState } from 'react';
import { ActiveTab, Therapist } from './types';
import { INITIAL_THERAPISTS, KPIS_BY_DEPARTMENT } from './data/mockData';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HomeScreen } from './components/HomeScreen';
import { AssessmentScreen } from './components/AssessmentScreen';
import { TherapistsScreen } from './components/TherapistsScreen';
import { ManagementScreen } from './components/ManagementScreen';
import { WellnessHubScreen } from './components/WellnessHubScreen';
import { BreathingModal } from './components/BreathingModal';
import { SOSModal } from './components/SOSModal';
import { VideoRoomModal } from './components/VideoRoomModal';
import { ScheduleModal } from './components/ScheduleModal';
import { TherapistDetailModal } from './components/TherapistDetailModal';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ProfileModal } from './components/ProfileModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('inicio');
  const [isAssessmentActive, setIsAssessmentActive] = useState(false);
  const [currentWellnessScore, setCurrentWellnessScore] = useState(84);
  const [isDiscretionActive, setIsDiscretionActive] = useState(false);

  // Modals state
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [breathingTechnique, setBreathingTechnique] = useState<'478' | 'box'>('478');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isVideoRoomOpen, setIsVideoRoomOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [schedulingTherapist, setSchedulingTherapist] = useState<Therapist | null>(null);
  const [selectedTherapistProfile, setSelectedTherapistProfile] = useState<Therapist | null>(null);

  // Subtitle per tab
  const tabSubtitles: Record<ActiveTab, string> = {
    inicio: 'Início',
    'bem-estar': 'Bem-Estar',
    especialistas: 'Especialistas',
    'synapse-ai': 'Synapse AI',
    gestao: 'Gestão',
  };

  const handleOpenBreathing = (technique: '478' | 'box' = '478') => {
    setBreathingTechnique(technique);
    setIsBreathingOpen(true);
  };

  const handleOpenTherapistProfileById = (id: string) => {
    const found = INITIAL_THERAPISTS.find((t) => t.id === id) || INITIAL_THERAPISTS[0];
    setSelectedTherapistProfile(found);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col relative font-outfit">
      {/* Discretion Shade Full-Screen Overlay (if active) */}
      {isDiscretionActive && (
        <div
          onClick={() => setIsDiscretionActive(false)}
          className="fixed inset-0 z-50 bg-[#0b1c30]/25 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all"
        >
          <div className="bg-white/95 rounded-3xl p-6 shadow-2xl max-w-sm border border-white/60 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[#eff4ff] text-[#6b38d4] flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">visibility_off</span>
            </div>
            <h3 className="font-sora text-base font-bold text-[#0b1c30]">
              Discretion Shade Ativo
            </h3>
            <p className="text-xs text-[#494454]">
              Os dados de saúde mental foram ocultados da tela por privacidade. Toque em qualquer lugar para restaurar.
            </p>
            <span className="mt-2 px-4 py-1.5 rounded-full bg-[#6b38d4] text-white text-xs font-semibold">
              Restaurar Visualização
            </span>
          </div>
        </div>
      )}

      {/* Main Top Header (hidden when inside Assessment flow to use dedicated flow header) */}
      {!isAssessmentActive && (
        <Header
          title="Synapse"
          subtitle={tabSubtitles[activeTab]}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
      )}

      {/* Active Screen Rendering */}
      {isAssessmentActive ? (
        <AssessmentScreen
          onBack={() => setIsAssessmentActive(false)}
          onFinish={(newScore) => {
            setCurrentWellnessScore(newScore);
            setIsAssessmentActive(false);
          }}
        />
      ) : (
        <main className="flex-1 flex flex-col w-full">
          {activeTab === 'inicio' && (
            <HomeScreen
              onStartAssessment={() => setIsAssessmentActive(true)}
              onOpenBreathing={handleOpenBreathing}
              onOpenSOS={() => setIsSOSOpen(true)}
              onOpenVideoRoom={() => setIsVideoRoomOpen(true)}
              onOpenTherapistProfile={handleOpenTherapistProfileById}
              isDiscretionActive={isDiscretionActive}
              onToggleDiscretion={() => setIsDiscretionActive(!isDiscretionActive)}
              currentWellnessScore={currentWellnessScore}
            />
          )}

          {activeTab === 'especialistas' && (
            <TherapistsScreen
              onSchedule={(th) => setSchedulingTherapist(th)}
              onViewProfile={(th) => setSelectedTherapistProfile(th)}
              isDiscretionActive={isDiscretionActive}
            />
          )}

          {activeTab === 'gestao' && (
            <ManagementScreen
              onOpenReportModal={() => setIsReportModalOpen(true)}
              isDiscretionActive={isDiscretionActive}
            />
          )}

          {(activeTab === 'bem-estar' || activeTab === 'synapse-ai') && (
            <WellnessHubScreen
              onOpenBreathing={handleOpenBreathing}
              onOpenSOS={() => setIsSOSOpen(true)}
              onOpenSchedule={() => {
                setActiveTab('especialistas');
              }}
              isDiscretionActive={isDiscretionActive}
            />
          )}
        </main>
      )}

      {/* Bottom Floating Navigation (hidden during assessment) */}
      {!isAssessmentActive && (
        <Navigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Interactive Modals */}
      <BreathingModal
        isOpen={isBreathingOpen}
        onClose={() => setIsBreathingOpen(false)}
        technique={breathingTechnique}
      />

      <SOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
      />

      <VideoRoomModal
        isOpen={isVideoRoomOpen}
        onClose={() => setIsVideoRoomOpen(false)}
      />

      <ScheduleModal
        isOpen={schedulingTherapist !== null}
        therapist={schedulingTherapist}
        onClose={() => setSchedulingTherapist(null)}
        onBookSuccess={({ therapist, slot }) => {
          alert(`Sessão agendada com ${therapist.name} para ${slot}! Convite salvo no seu calendário.`);
        }}
      />

      <TherapistDetailModal
        isOpen={selectedTherapistProfile !== null}
        therapist={selectedTherapistProfile}
        onClose={() => setSelectedTherapistProfile(null)}
        onSchedule={(th) => {
          setSelectedTherapistProfile(null);
          setSchedulingTherapist(th);
        }}
      />

      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        kpis={KPIS_BY_DEPARTMENT.all}
        departmentName="Toda a Empresa (450 colaboradores)"
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onOpenSession={() => setIsVideoRoomOpen(true)}
        onOpenAssessment={() => setIsAssessmentActive(true)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onToggleDiscretion={() => setIsDiscretionActive(!isDiscretionActive)}
        isDiscretionActive={isDiscretionActive}
      />
    </div>
  );
}
