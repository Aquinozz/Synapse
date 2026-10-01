import React, { useState } from 'react';
import { errorMessage } from '../../api/client';
import { useToast } from '../../components/Toast';
import { Patient } from '../../data/psychologistMock';
import { useNow } from '../../utils/schedule';
import { EvolutionChart } from './EvolutionChart';
import { EVALUATION, Evaluation, SCORES, formatSessionDay, sessionsHeld } from './evaluations';

interface EvolutionPanelProps {
  patient: Patient;
  /** This patient's evaluations, oldest first */
  evaluations: Evaluation[];
  /** Session to start scoring, when the panel is opened from a reminder */
  initialDay?: string;
  /** Both reject with an ApiError */
  onSave: (day: string, score: number, comment: string) => Promise<void>;
  onRemove: (day: string) => Promise<void>;
}

/** How many unscored sessions are offered at once */
const MAX_PENDING_SHOWN = 6;

/** The patient's progress: the chart, the score of each session and the form to give one */
export const EvolutionPanel: React.FC<EvolutionPanelProps> = ({ patient, evaluations, initialDay, onSave, onRemove }) => {
  const showToast = useToast();
  const now = useNow();
  const firstName = patient.name.split(' ')[0];

  const held = sessionsHeld(patient, now);
  const scoredDays = new Set(evaluations.map((evaluation) => evaluation.date));
  const pending = held.filter((day) => !scoredDays.has(day)).slice(0, MAX_PENDING_SHOWN);

  // The session being scored: an unscored one, or one already scored that is being changed
  const [chosenDay, setChosenDay] = useState<string | null>(initialDay ?? null);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const editing = evaluations.find((evaluation) => evaluation.date === chosenDay);
  // Without a choice, the latest unscored session is the one to score
  const day = editing || (chosenDay && pending.includes(chosenDay)) ? chosenDay : pending[0] ?? null;

  const resetForm = () => {
    setChosenDay(null);
    setScore(null);
    setComment('');
  };

  const startEditing = (evaluation: Evaluation) => {
    setChosenDay(evaluation.date);
    setScore(evaluation.score);
    setComment(evaluation.comment);
    setConfirmingDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!day || score === null) return;
    setIsSaving(true);
    try {
      await onSave(day, score, comment.trim());
      showToast(editing ? 'Avaliação atualizada.' : 'Avaliação salva.');
      resetForm();
    } catch (err) {
      showToast(errorMessage(err), 'info');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (evaluationDay: string) => {
    try {
      await onRemove(evaluationDay);
      if (chosenDay === evaluationDay) resetForm();
      showToast('Avaliação excluída.');
    } catch (err) {
      showToast(errorMessage(err), 'info');
    } finally {
      setConfirmingDelete(null);
    }
  };

  const actionClass = 'h-9 px-3 rounded-full font-outfit text-xs font-semibold transition-colors flex items-center gap-1';

  return (
    <>
      {evaluations.length > 0 ? (
        <EvolutionChart evaluations={evaluations} patientName={patient.name} />
      ) : (
        <p className="p-4 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff] font-outfit text-sm text-[#494454] text-center">
          O gráfico de evolução de {firstName} aparece aqui depois da primeira sessão avaliada.
        </p>
      )}

      {/* Avaliar uma sessão */}
      {day ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 rounded-2xl border border-[#e5eeff]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="font-sora text-base font-bold text-[#0b1c30]">
              {editing ? 'Alterar avaliação' : 'Avaliar sessão'}
            </h4>
            {editing && (
              <button type="button" onClick={resetForm} className={`${actionClass} text-[#494454] hover:bg-[#eff4ff]`}>
                Cancelar
              </button>
            )}
          </div>

          {editing || pending.length === 1 ? (
            <p className="font-outfit text-sm text-[#494454]">
              Sessão de <strong className="text-[#0b1c30] font-semibold">{formatSessionDay(day)}</strong>
            </p>
          ) : (
            <fieldset className="flex flex-col gap-1.5">
              <legend className="font-outfit text-sm font-semibold text-[#0b1c30] mb-1.5">Qual sessão?</legend>
              <div className="flex flex-wrap gap-2">
                {pending.map((option) => (
                  <label
                    key={option}
                    className={`min-h-10 px-3.5 py-1.5 rounded-full border font-outfit text-sm font-semibold flex items-center cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#6b38d4] has-[:focus-visible]:ring-offset-2 ${
                      option === day
                        ? 'bg-[#6b38d4] text-white border-[#6b38d4]'
                        : 'bg-white text-[#0b1c30] border-[#e5eeff] hover:border-[#6b38d4]/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="evaluation-day"
                      checked={option === day}
                      onChange={() => setChosenDay(option)}
                      className="sr-only"
                    />
                    {formatSessionDay(option)}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="flex flex-col gap-1.5">
            <legend className="font-outfit text-sm font-semibold text-[#0b1c30] mb-1.5">
              Como {firstName} está? Dê uma nota de {EVALUATION.minScore} a {EVALUATION.maxScore}
            </legend>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {SCORES.map((option) => (
                <label
                  key={option}
                  className={`h-11 rounded-xl border font-sora text-base font-bold flex items-center justify-center cursor-pointer tabular-nums transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#6b38d4] has-[:focus-visible]:ring-offset-2 ${
                    option === score
                      ? 'bg-[#6b38d4] text-white border-[#6b38d4]'
                      : 'bg-white text-[#0b1c30] border-[#e5eeff] hover:border-[#6b38d4]/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="evaluation-score"
                    aria-label={`Nota ${option}`}
                    checked={option === score}
                    onChange={() => setScore(option)}
                    className="sr-only"
                  />
                  {option}
                </label>
              ))}
            </div>
            <div className="flex justify-between font-outfit text-xs text-[#7b7486]">
              <span>{EVALUATION.minScore} = muito mal</span>
              <span>{EVALUATION.maxScore} = muito bem</span>
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="evaluation-comment" className="font-outfit text-sm font-semibold text-[#0b1c30] flex items-baseline justify-between gap-2">
              Comentário (opcional)
              <span className="text-xs font-normal text-[#7b7486] tabular-nums">
                {comment.length}/{EVALUATION.commentMax}
              </span>
            </label>
            <textarea
              id="evaluation-comment"
              rows={2}
              maxLength={EVALUATION.commentMax}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="O que explica esta nota?"
              className="p-3 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff] text-base font-outfit text-[#0b1c30] placeholder:text-[#7b7486] resize-none focus:outline-none focus:border-[#6b38d4] focus:ring-2 focus:ring-[#6b38d4]/20"
            />
          </div>

          <button
            type="submit"
            disabled={score === null || isSaving}
            className="h-11 px-5 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold transition-all active:scale-[0.98] disabled:bg-[#cbc3d7] disabled:active:scale-100"
          >
            {isSaving ? 'Salvando...' : editing ? 'Salvar alteração' : 'Salvar avaliação'}
          </button>
        </form>
      ) : (
        <p className="p-4 rounded-2xl bg-[#6ffbbe]/20 font-outfit text-sm text-[#005236] flex items-start gap-2">
          <span className="material-symbols-outlined text-[1.25rem] shrink-0">check_circle</span>
          {held.length === 0
            ? `A primeira sessão com ${firstName} ainda não aconteceu. Depois dela, a avaliação aparece aqui.`
            : 'Todas as sessões realizadas estão avaliadas. A próxima aparece aqui depois do atendimento.'}
        </p>
      )}

      {/* Histórico */}
      {evaluations.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="font-outfit text-sm font-semibold text-[#0b1c30]">Sessões avaliadas ({evaluations.length})</h4>
          <ul className="flex flex-col gap-2">
            {[...evaluations].reverse().map((evaluation) => (
              <li
                key={evaluation.date}
                className={`p-3 rounded-2xl border flex items-start gap-3 ${
                  evaluation.date === editing?.date ? 'border-[#6b38d4]/50 bg-[#fbf9ff]' : 'border-[#e5eeff] bg-[#f8f9ff]'
                }`}
              >
                <span
                  aria-label={`Nota ${evaluation.score}`}
                  className="w-11 h-11 rounded-xl bg-[#e9ddff] text-[#5516be] font-sora text-lg font-bold flex items-center justify-center shrink-0 tabular-nums"
                >
                  {evaluation.score}
                </span>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <span className="font-outfit text-sm font-semibold text-[#0b1c30]">
                    {formatSessionDay(evaluation.date)}
                  </span>
                  {evaluation.comment && (
                    <p className="font-outfit text-sm text-[#494454] leading-relaxed whitespace-pre-wrap break-words">
                      {evaluation.comment}
                    </p>
                  )}
                  <div className="flex items-center gap-1 flex-wrap -ml-3">
                    {confirmingDelete === evaluation.date ? (
                      <>
                        <span className="font-outfit text-xs text-[#ba1a1a] pl-3 pr-1">Excluir esta avaliação?</span>
                        <button
                          type="button"
                          onClick={() => handleRemove(evaluation.date)}
                          className={`${actionClass} bg-[#ba1a1a] text-white hover:bg-[#93000a]`}
                        >
                          Excluir
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDelete(null)}
                          className={`${actionClass} text-[#494454] hover:bg-white`}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditing(evaluation)}
                          aria-label={`Alterar avaliação de ${formatSessionDay(evaluation.date)}`}
                          className={`${actionClass} text-[#5516be] hover:bg-white`}
                        >
                          <span className="material-symbols-outlined text-[1.125rem]">edit</span>
                          Alterar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDelete(evaluation.date)}
                          aria-label={`Excluir avaliação de ${formatSessionDay(evaluation.date)}`}
                          className={`${actionClass} text-[#ba1a1a] hover:bg-white`}
                        >
                          <span className="material-symbols-outlined text-[1.125rem]">delete</span>
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="flex items-start gap-2 font-outfit text-xs text-[#7b7486] leading-snug">
        <span className="material-symbols-outlined text-[1.125rem] text-[#0051d5] shrink-0">lock</span>
        Só você vê estas notas. Nem o paciente nem a empresa dele têm acesso.
      </p>
    </>
  );
};
