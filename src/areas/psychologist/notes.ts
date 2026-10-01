import { useCallback, useEffect, useState } from 'react';
import { PatientNote } from '../../data/psychologistMock';

// One list per psychologist account, so accounts sharing a browser do not see each other's notes
const storageKey = (userId: number) => `synapse:patient-notes:${userId}`;

const loadNotes = (userId: number): PatientNote[] => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as PatientNote[]) : [];
  } catch {
    return [];
  }
};

export interface PatientNotes {
  /** Notes of one patient: pinned first, then newest first */
  notesOf: (patientId: number) => PatientNote[];
  add: (patientId: number, text: string, pinned?: boolean) => void;
  update: (id: string, patch: Partial<Pick<PatientNote, 'text' | 'pinned'>>) => void;
  remove: (id: string) => void;
}

/** The psychologist's notes per patient. Still kept in this browser: the API has no notes endpoint yet. */
export const usePatientNotes = (userId: number): PatientNotes => {
  const [notes, setNotes] = useState<PatientNote[]>(() => loadNotes(userId));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(notes));
    } catch {
      // Storage unavailable: notes last until the tab is reloaded
    }
  }, [notes, userId]);

  const notesOf = useCallback(
    (patientId: number) =>
      notes
        .filter((note) => note.patientId === patientId)
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt)),
    [notes]
  );

  const add = useCallback((patientId: number, text: string, pinned = false) => {
    const note: PatientNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      patientId,
      createdAt: new Date().toISOString(),
      text,
      pinned,
    };
    setNotes((current) => [...current, note]);
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<Pick<PatientNote, 'text' | 'pinned'>>) =>
      setNotes((current) => current.map((note) => (note.id === id ? { ...note, ...patch } : note))),
    []
  );

  const remove = useCallback(
    (id: string) => setNotes((current) => current.filter((note) => note.id !== id)),
    []
  );

  return { notesOf, add, update, remove };
};
