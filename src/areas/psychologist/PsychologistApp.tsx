import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router';
import { api, errorMessage } from '../../api/client';
import { Session, useSession } from '../../auth/session';
import { AppShell, NavItem } from '../../components/AppShell';
import { LoadingScreen } from '../../components/LoadingScreen';
import { useToast } from '../../components/Toast';
import { VideoRoomModal } from '../../components/VideoRoomModal';
import { Patient, slotKey } from '../../data/psychologistMock';
import { SessionFormat, Therapist } from '../../types';
import { PsiHomeScreen } from './PsiHomeScreen';
import { PsiAgendaScreen } from './PsiAgendaScreen';
import { PsiPatientsScreen } from './PsiPatientsScreen';
import { PsiProfileScreen } from './PsiProfileScreen';
import { PsiFinanceScreen } from './PsiFinanceScreen';
import { PatientModal } from './PatientModal';
import { usePatientNotes } from './notes';

const NAV_ITEMS: NavItem[] = [
  { to: '/psi/inicio', label: 'Início', icon: 'grid_view' },
  { to: '/psi/agenda', label: 'Agenda', icon: 'calendar_month' },
  { to: '/psi/pacientes', label: 'Pacientes', icon: 'groups' },
  { to: '/psi/financeiro', label: 'Financeiro', icon: 'payments' },
  { to: '/psi/perfil', label: 'Perfil', icon: 'account_circle' },
];

interface Slot {
  weekday: number;
  time: string;
  /** Held by a patient: cannot be closed */
  taken: boolean;
}

interface ApiPatient {
  id: number;
  name: string;
  weekday: number;
  time: string;
  format: SessionFormat;
  /** ISO date-time */
  since: string;
}

const toPatient = (p: ApiPatient): Patient => ({ ...p, since: new Date(p.since) });

export const PsychologistApp: React.FC = () => {
  const { session } = useSession();
  // The route guard only renders this area with a session
  return session ? <PsychologistContent session={session} /> : null;
};

const PsychologistContent: React.FC<{ session: Session }> = ({ session }) => {
  const navigate = useNavigate();
  const showToast = useToast();
  const { logout } = useSession();
  const notes = usePatientNotes(session.id);

  const [profile, setProfile] = useState<Therapist | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [callWith, setCallWith] = useState<Patient | null>(null);
  const [openPatient, setOpenPatient] = useState<Patient | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [profileRes, slotsRes, patientsRes] = await Promise.all([
        api<{ profile: Therapist }>('GET', '/psi/profile'),
        api<{ slots: Slot[] }>('GET', '/psi/availability'),
        api<{ patients: ApiPatient[] }>('GET', '/psi/patients'),
      ]);
      setProfile(profileRes.profile);
      setSlots(slotsRes.slots);
      setPatients(patientsRes.patients.map(toPatient));
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Free weekly slots offered to employees, as "weekday-time" keys */
  const openSlots = useMemo(
    () => new Set(slots.filter((slot) => !slot.taken).map((slot) => slotKey(slot.weekday, slot.time))),
    [slots]
  );

  const toggleSlot = async (weekday: number, time: string) => {
    const exists = slots.some((slot) => slot.weekday === weekday && slot.time === time);
    const wanted = exists
      ? slots.filter((slot) => !(slot.weekday === weekday && slot.time === time))
      : [...slots, { weekday, time, taken: false }];
    try {
      const { slots: saved } = await api<{ slots: Slot[] }>('PUT', '/psi/availability', {
        slots: wanted.map((slot) => ({ weekday: slot.weekday, time: slot.time })),
      });
      setSlots(saved);
      // The public profile lists the free slots
      const { profile: fresh } = await api<{ profile: Therapist }>('GET', '/psi/profile');
      setProfile(fresh);
    } catch (err) {
      showToast(errorMessage(err), 'info');
      // Someone may have just taken the slot: show the current state
      load();
    }
  };

  const saveProfile = async (bio: string, tags: Therapist['tags']) => {
    const { profile: saved } = await api<{ profile: Therapist }>('PUT', '/psi/profile', { bio, tags });
    setProfile(saved);
  };

  if (!profile) return <LoadingScreen error={loadError} onRetry={load} />;

  return (
    <>
      <Routes>
        <Route
          element={
            <AppShell
              navItems={NAV_ITEMS}
              user={{ name: profile.name, image: profile.avatar }}
              onOpenProfile={() => navigate('/psi/perfil')}
              headerBadge={profile.status === 'active' ? `${profile.reg} verificado` : 'Registro em análise'}
              sidebarFooter={
                <button
                  onClick={logout}
                  className="h-11 px-3 rounded-xl text-[#494454] hover:bg-[#eff4ff] hover:text-[#0b1c30] font-outfit text-sm font-medium flex items-center gap-3 transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">logout</span>
                  <span>Sair</span>
                </button>
              }
            >
              <Outlet />
            </AppShell>
          }
        >
          <Route
            path="inicio"
            element={
              <PsiHomeScreen
                profile={profile}
                patients={patients}
                openSlotCount={openSlots.size}
                notes={notes}
                onOpenPatient={setOpenPatient}
                onJoin={setCallWith}
                onOpenAgenda={() => navigate('/psi/agenda')}
              />
            }
          />
          <Route
            path="agenda"
            element={
              <PsiAgendaScreen
                patients={patients}
                openSlots={openSlots}
                onToggleSlot={toggleSlot}
                onOpenPatient={setOpenPatient}
              />
            }
          />
          <Route
            path="pacientes"
            element={<PsiPatientsScreen patients={patients} notes={notes} onOpenPatient={setOpenPatient} />}
          />
          <Route path="financeiro" element={<PsiFinanceScreen patients={patients} />} />
          <Route
            path="perfil"
            element={<PsiProfileScreen profile={profile} onSave={saveProfile} onLogout={logout} />}
          />
          <Route path="*" element={<Navigate to="/psi/inicio" replace />} />
        </Route>
      </Routes>

      <VideoRoomModal
        isOpen={callWith !== null}
        onClose={() => setCallWith(null)}
        remoteName={callWith?.name ?? ''}
        remoteRole="Paciente"
        selfImage={profile.avatar ?? undefined}
        notesTitle={callWith ? `Anotações de ${callWith.name.split(' ')[0]}` : undefined}
        onSaveNote={callWith ? (text) => notes.add(callWith.id, text) : undefined}
      />

      <PatientModal patient={openPatient} notes={notes} onClose={() => setOpenPatient(null)} />
    </>
  );
};
