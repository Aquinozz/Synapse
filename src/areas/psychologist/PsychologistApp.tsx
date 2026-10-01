import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router';
import { api, errorMessage } from '../../api/client';
import { Session, useSession } from '../../auth/session';
import { AppShell, NavItem } from '../../components/AppShell';
import { LoadingScreen } from '../../components/LoadingScreen';
import { useToast } from '../../components/Toast';
import { VideoRoomModal } from '../../components/VideoRoomModal';
import { Patient, slotKey } from '../../data/psychologistMock';
import { ProfileCatalog, SessionFormat, Therapist } from '../../types';
import { PsiHomeScreen } from './PsiHomeScreen';
import { PsiAgendaScreen } from './PsiAgendaScreen';
import { PsiPatientsScreen } from './PsiPatientsScreen';
import { ProfileChanges, PsiProfileScreen } from './PsiProfileScreen';
import { PsiFinanceScreen } from './PsiFinanceScreen';
import { OpenPatient, PatientModal, PatientTab } from './PatientModal';
import { CheckinAlert, Evaluation } from './evaluations';
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
  avatar: string | null;
  weekday: number;
  time: string;
  format: SessionFormat;
  /** ISO date-time */
  since: string;
  rescheduledTo: string | null;
}

/** How often the alerts are checked while the area is open */
const ALERT_POLL_MS = 60_000;

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
  const [catalog, setCatalog] = useState<ProfileCatalog | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [callWith, setCallWith] = useState<Patient | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [alerts, setAlerts] = useState<CheckinAlert[]>([]);
  // Alerts already shown, so only new ones are announced
  const knownAlerts = useRef<Set<string> | null>(null);
  const [openPatient, setOpenPatient] = useState<OpenPatient | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [profileRes, slotsRes, patientsRes, catalogRes, evaluationsRes] = await Promise.all([
        api<{ profile: Therapist }>('GET', '/psi/profile'),
        api<{ slots: Slot[] }>('GET', '/psi/availability'),
        api<{ patients: ApiPatient[] }>('GET', '/psi/patients'),
        api<{ catalog: ProfileCatalog }>('GET', '/catalog'),
        api<{ evaluations: Evaluation[] }>('GET', '/psi/evaluations'),
      ]);
      setEvaluations(evaluationsRes.evaluations);
      setCatalog(catalogRes.catalog);
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

  // Patients whose check-in came out very low. Checked again from time to time, so the
  // psychologist is told without having to reload the page.
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const { alerts: current } = await api<{ alerts: CheckinAlert[] }>('GET', '/psi/alerts');
        if (cancelled) return;
        const keys = new Set(current.map((alert) => `${alert.patientId}-${alert.day}-${alert.score}`));
        const fresh = current.filter((alert) => !knownAlerts.current?.has(`${alert.patientId}-${alert.day}-${alert.score}`));
        if (knownAlerts.current && fresh.length > 0) {
          showToast(`Alerta: o check-in de ${fresh[0].name} ficou muito baixo.`, 'info');
        }
        knownAlerts.current = keys;
        setAlerts(current);
      } catch {
        // Keeps what is on screen; the next round tries again
      }
    };
    check();
    const timer = window.setInterval(check, ALERT_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [showToast]);

  const dismissAlert = async (patientId: number) => {
    try {
      const { alerts: current } = await api<{ alerts: CheckinAlert[] }>('POST', `/psi/alerts/${patientId}/seen`);
      setAlerts(current);
    } catch (err) {
      showToast(errorMessage(err), 'info');
    }
  };

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

  const saveProfile = async (changes: ProfileChanges) => {
    const { profile: saved } = await api<{ profile: Therapist }>('PUT', '/psi/profile', changes);
    setProfile(saved);
  };

  // Opens a patient on the progress chart, on the notes, or straight on a session to score
  const showPatient = (patient: Patient, tab: PatientTab = 'evolution', day?: string) =>
    setOpenPatient({ patient, tab, day });

  const isSameEvaluation = (evaluation: Evaluation, patientId: number, day: string) =>
    evaluation.patientId === patientId && evaluation.date === day;

  const saveEvaluation = async (patientId: number, day: string, score: number, comment: string) => {
    const { evaluation } = await api<{ evaluation: Evaluation }>('PUT', `/psi/patients/${patientId}/evaluations/${day}`, {
      score,
      comment,
    });
    setEvaluations((current) => [...current.filter((item) => !isSameEvaluation(item, patientId, day)), evaluation]);
  };

  const removeEvaluation = async (patientId: number, day: string) => {
    await api('DELETE', `/psi/patients/${patientId}/evaluations/${day}`);
    setEvaluations((current) => current.filter((item) => !isSameEvaluation(item, patientId, day)));
  };

  const savePhoto = async (image: string | null) => {
    const { profile: saved } = await api<{ profile: Therapist }>('PUT', '/psi/avatar', { image });
    setProfile(saved);
  };

  if (!profile || !catalog) return <LoadingScreen error={loadError} onRetry={load} />;

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
                  <span className="material-symbols-outlined text-[1.5rem]">logout</span>
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
                evaluations={evaluations}
                alerts={alerts}
                onDismissAlert={dismissAlert}
                onOpenPatient={showPatient}
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
                onOpenPatient={showPatient}
              />
            }
          />
          <Route
            path="pacientes"
            element={
              <PsiPatientsScreen patients={patients} notes={notes} evaluations={evaluations} onOpenPatient={showPatient} />
            }
          />
          <Route path="financeiro" element={<PsiFinanceScreen patients={patients} />} />
          <Route
            path="perfil"
            element={
              <PsiProfileScreen profile={profile} catalog={catalog} onSave={saveProfile} onSavePhoto={savePhoto} onLogout={logout} />
            }
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

      <PatientModal
        open={openPatient}
        notes={notes}
        evaluations={evaluations}
        onSaveEvaluation={saveEvaluation}
        onRemoveEvaluation={removeEvaluation}
        onClose={() => setOpenPatient(null)}
      />
    </>
  );
};
