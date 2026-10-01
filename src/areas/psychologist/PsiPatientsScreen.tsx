import React, { useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { Patient } from '../../data/psychologistMock';
import { Evaluation, evaluationsOf, sessionsToEvaluate } from './evaluations';
import { PatientNotes } from './notes';
import { formatDayTime, formatRecurring, nextOccurrence, useNow } from '../../utils/schedule';

interface PsiPatientsScreenProps {
  patients: Patient[];
  notes: PatientNotes;
  evaluations: Evaluation[];
  onOpenPatient: (patient: Patient) => void;
}

const formatSince = (since: Date) => since.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export const PsiPatientsScreen: React.FC<PsiPatientsScreenProps> = ({ patients, notes, evaluations, onOpenPatient }) => {
  const now = useNow();
  const [searchTerm, setSearchTerm] = useState('');
  const term = searchTerm.trim().toLowerCase();

  const listed = patients
    .filter(
      (p) =>
        !term ||
        p.name.toLowerCase().includes(term) ||
        notes.notesOf(p.id).some((note) => note.text.toLowerCase().includes(term))
    )
    .map((p) => ({
      patient: p,
      next: nextOccurrence(p.weekday, p.time, now),
      notes: notes.notesOf(p.id),
      lastScore: evaluationsOf(evaluations, p.id).at(-1)?.score,
      hasSessionToEvaluate: sessionsToEvaluate([p], evaluations, now).length > 0,
    }))
    .sort((a, b) => a.next.getTime() - b.next.getTime());

  return (
    <div className="screen">
      <section className="flex items-end justify-between gap-3 flex-wrap">
        <div className="flex flex-col">
          <h1 className="font-sora text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight">Pacientes</h1>
          <p className="font-outfit text-sm lg:text-base text-[#494454]">
            {patients.length} {patients.length === 1 ? 'pessoa' : 'pessoas'} em acompanhamento semanal. Toque em alguém para ver a evolução e as anotações.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <label className="sr-only" htmlFor="patient-search">Buscar paciente</label>
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7b7486]">
            <span className="material-symbols-outlined text-[1.375rem]">search</span>
          </span>
          <input
            id="patient-search"
            type="text"
            autoComplete="off"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou anotação"
            className="w-full h-11 pl-11 pr-4 bg-white border border-[#e5eeff] rounded-full text-sm font-outfit text-[#0b1c30] placeholder:text-[#7b7486] focus:outline-none focus:border-[#6b38d4] focus:ring-2 focus:ring-[#6b38d4]/20"
          />
        </div>
      </section>

      <section className="card !p-2 lg:!p-3">
        <ul className="flex flex-col divide-y divide-[#eff4ff]">
          {listed.map(({ patient, next, notes: patientNotes, lastScore, hasSessionToEvaluate }) => {
            const pinned = patientNotes.find((note) => note.pinned);
            return (
              <li key={patient.id}>
                <button
                  onClick={() => onOpenPatient(patient)}
                  className="w-full p-3 rounded-2xl text-left flex items-center gap-3 flex-wrap sm:flex-nowrap hover:bg-[#f8f9ff] transition-colors"
                >
                  <Avatar name={patient.name} image={patient.avatar} className="w-11 h-11 text-sm" />
                  <span className="flex flex-col min-w-0 flex-1 basis-40">
                    <span className="font-outfit text-sm font-semibold text-[#0b1c30]">{patient.name}</span>
                    <span className="font-outfit text-xs text-[#494454]">
                      {formatRecurring(patient.weekday, patient.time)} · próxima {formatDayTime(next, now).toLowerCase()}
                    </span>
                    {pinned && (
                      <span className="font-outfit text-xs text-[#7a4100] flex items-start gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[1rem] fill-1 shrink-0">push_pin</span>
                        <span className="line-clamp-1">{pinned.text}</span>
                      </span>
                    )}
                  </span>
                  <span className="flex items-center sm:justify-end gap-2 flex-wrap basis-full sm:basis-auto sm:max-w-[60%] pl-14 sm:pl-0 font-outfit text-xs text-[#494454]">
                    <span className="hidden lg:inline">Desde {formatSince(patient.since)}</span>
                    {hasSessionToEvaluate ? (
                      <span className="px-2.5 py-1 rounded-full font-semibold whitespace-nowrap flex items-center gap-1 bg-[#ffe9c7] text-[#7a4100]">
                        <span className="material-symbols-outlined text-[1rem]">rate_review</span>
                        Sessão para avaliar
                      </span>
                    ) : (
                      lastScore !== undefined && (
                        <span className="px-2.5 py-1 rounded-full font-semibold whitespace-nowrap flex items-center gap-1 bg-[#6ffbbe]/30 text-[#005236]">
                          <span className="material-symbols-outlined text-[1rem]">monitoring</span>
                          Última nota {lastScore}
                        </span>
                      )
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-full font-semibold whitespace-nowrap flex items-center gap-1 ${
                        patientNotes.length > 0 ? 'bg-[#e9ddff]/70 text-[#5516be]' : 'bg-[#eff4ff] text-[#494454]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[1rem]">sticky_note_2</span>
                      {patientNotes.length === 0
                        ? 'Sem anotações'
                        : `${patientNotes.length} ${patientNotes.length === 1 ? 'anotação' : 'anotações'}`}
                    </span>
                    <span className="material-symbols-outlined text-[1.375rem] text-[#7b7486]">chevron_right</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {listed.length === 0 && (
          <p className="p-6 text-center font-outfit text-sm text-[#494454]">
            {patients.length === 0
              ? 'Você ainda não tem pacientes. Eles aparecem aqui quando um funcionário escolhe um horário seu.'
              : 'Nenhum paciente ou anotação com esse termo.'}
          </p>
        )}
      </section>

      <aside className="rounded-3xl p-4 bg-[#eff4ff] border border-[#dce9ff] flex items-start gap-3">
        <span className="material-symbols-outlined text-[1.375rem] text-[#0051d5] fill-1 shrink-0">verified_user</span>
        <p className="font-outfit text-sm text-[#494454] leading-snug">
          <strong className="text-[#003ea8] font-semibold">Sigilo profissional:</strong> a empresa de cada paciente não tem acesso a esta lista nem ao conteúdo das sessões.
        </p>
      </aside>
    </div>
  );
};
