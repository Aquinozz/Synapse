import React, { useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { Modal, ModalCloseButton } from '../../components/Modal';
import { Patient, PatientNote } from '../../data/psychologistMock';
import { formatDayTime, formatRecurring, nextOccurrence } from '../../utils/schedule';
import { PatientNotes } from './notes';

interface PatientModalProps {
  patient: Patient | null;
  notes: PatientNotes;
  onClose: () => void;
}

export const PatientModal: React.FC<PatientModalProps> = ({ patient, notes, onClose }) => (
  <Modal
    isOpen={patient !== null}
    onClose={onClose}
    label={patient ? `Anotações de ${patient.name}` : 'Anotações'}
    maxWidth="max-w-xl"
    className="gap-4"
  >
    {patient && <PatientContent patient={patient} notes={notes} onClose={onClose} />}
  </Modal>
);

const formatNoteDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

const PatientContent: React.FC<{ patient: Patient; notes: PatientNotes; onClose: () => void }> = ({
  patient,
  notes,
  onClose,
}) => {
  const [draft, setDraft] = useState('');
  const [pinDraft, setPinDraft] = useState(false);
  const list = notes.notesOf(patient.id);
  const now = new Date();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    notes.add(patient.id, text, pinDraft);
    setDraft('');
    setPinDraft(false);
  };

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={patient.name} className="w-12 h-12 text-base" />
          <div className="flex flex-col min-w-0 font-outfit">
            <h3 className="font-sora text-lg font-bold text-[#0b1c30] truncate">{patient.name}</h3>
            <span className="text-sm text-[#494454]">
              {formatRecurring(patient.weekday, patient.time)} · {patient.format === 'video' ? 'vídeo' : 'áudio'}
            </span>
            <span className="text-xs text-[#6b38d4] font-semibold">
              Próxima sessão: {formatDayTime(nextOccurrence(patient.weekday, patient.time, now), now).toLowerCase()}
            </span>
          </div>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>

      {/* Nova anotação */}
      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        <label htmlFor="note-draft" className="font-outfit text-sm font-semibold text-[#0b1c30]">
          Nova anotação
        </label>
        <textarea
          id="note-draft"
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="O que vale registrar sobre este paciente?"
          className="p-3 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff] text-base font-outfit text-[#0b1c30] placeholder:text-[#7b7486] resize-none focus:outline-none focus:border-[#6b38d4] focus:ring-2 focus:ring-[#6b38d4]/20"
        />
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label className="flex items-center gap-2 font-outfit text-sm text-[#494454] cursor-pointer min-h-11">
            <input
              type="checkbox"
              checked={pinDraft}
              onChange={(e) => setPinDraft(e.target.checked)}
              className="w-5 h-5 accent-[#6b38d4]"
            />
            Lembrar na próxima sessão
          </label>
          <button
            type="submit"
            disabled={!draft.trim()}
            className="h-11 px-5 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold transition-all active:scale-95 disabled:bg-[#cbc3d7] disabled:active:scale-100"
          >
            Salvar anotação
          </button>
        </div>
      </form>

      {/* Histórico */}
      <div className="flex flex-col gap-2">
        <h4 className="font-outfit text-sm font-semibold text-[#0b1c30]">
          Anotações ({list.length})
        </h4>

        {list.length === 0 ? (
          <p className="p-4 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff] font-outfit text-sm text-[#494454] text-center">
            Nenhuma anotação ainda. Registre aqui o que quiser lembrar sobre {patient.name.split(' ')[0]}.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {list.map((note) => (
              <NoteItem key={note.id} note={note} notes={notes} />
            ))}
          </ul>
        )}
      </div>

      <p className="flex items-start gap-2 font-outfit text-xs text-[#7b7486] leading-snug">
        <span className="material-symbols-outlined text-[16px] text-[#0051d5] shrink-0">lock</span>
        Só você vê estas anotações. Nem o paciente nem a empresa dele têm acesso.
      </p>
    </>
  );
};

const NoteItem: React.FC<{ note: PatientNote; notes: PatientNotes }> = ({ note, notes }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(note.text);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const saveEdit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    notes.update(note.id, { text: trimmed });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setText(note.text);
    setIsEditing(false);
  };

  const actionClass =
    'h-9 px-3 rounded-full font-outfit text-xs font-semibold transition-colors flex items-center gap-1';

  return (
    <li
      className={`p-3 rounded-2xl border flex flex-col gap-2 ${
        note.pinned ? 'bg-[#fff8e8] border-[#ffd8a8]' : 'bg-[#f8f9ff] border-[#e5eeff]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 font-outfit text-xs text-[#494454]">
        <span>{formatNoteDate(note.createdAt)}</span>
        {note.pinned && (
          <span className="flex items-center gap-1 font-semibold text-[#7a4100]">
            <span className="material-symbols-outlined text-[14px] fill-1">push_pin</span>
            Para a próxima sessão
          </span>
        )}
      </div>

      {isEditing ? (
        <textarea
          aria-label="Editar anotação"
          rows={3}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="p-3 rounded-xl bg-white border border-[#6b38d4] text-base font-outfit text-[#0b1c30] resize-none focus:outline-none focus:ring-2 focus:ring-[#6b38d4]/20"
        />
      ) : (
        <p className="font-outfit text-sm text-[#0b1c30] leading-relaxed whitespace-pre-wrap break-words">
          {note.text}
        </p>
      )}

      <div className="flex items-center gap-1 flex-wrap -ml-1">
        {isEditing ? (
          <>
            <button
              onClick={saveEdit}
              disabled={!text.trim()}
              className={`${actionClass} bg-[#6b38d4] text-white hover:bg-[#8455ef] disabled:bg-[#cbc3d7]`}
            >
              Salvar
            </button>
            <button onClick={cancelEdit} className={`${actionClass} text-[#494454] hover:bg-white`}>
              Cancelar
            </button>
          </>
        ) : confirmingDelete ? (
          <>
            <span className="font-outfit text-xs text-[#ba1a1a] px-1">Excluir esta anotação?</span>
            <button
              onClick={() => notes.remove(note.id)}
              className={`${actionClass} bg-[#ba1a1a] text-white hover:bg-[#93000a]`}
            >
              Excluir
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className={`${actionClass} text-[#494454] hover:bg-white`}
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => notes.update(note.id, { pinned: !note.pinned })}
              aria-pressed={note.pinned}
              className={`${actionClass} text-[#5516be] hover:bg-white`}
            >
              <span className="material-symbols-outlined text-[16px]">push_pin</span>
              {note.pinned ? 'Desafixar' : 'Lembrar na próxima'}
            </button>
            <button onClick={() => setIsEditing(true)} className={`${actionClass} text-[#5516be] hover:bg-white`}>
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Editar
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              className={`${actionClass} text-[#ba1a1a] hover:bg-white`}
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Excluir
            </button>
          </>
        )}
      </div>
    </li>
  );
};
