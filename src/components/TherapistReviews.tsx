import React, { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client';
import { useToast } from './Toast';

/** One review of a psychologist. The author is never sent; `mine` marks the viewer's own. */
interface Review {
  id: number;
  rating: number;
  comment: string;
  /** YYYY-MM-DD */
  date: string;
  mine: boolean;
}

interface ReviewListing {
  summary: { average: number; count: number; distribution: Record<string, number> };
  reviews: Review[];
  /** Only answered to employees */
  canReview?: boolean;
  reason?: 'not_your_psychologist' | 'no_session_yet' | null;
}

interface TherapistReviewsProps {
  /** The psychologist being viewed by an employee; omitted when psychologists read their own reviews */
  therapistId?: number;
  /** First name used in the form, e.g. "Dra. Camila" */
  therapistName?: string;
  /** Called after the viewer's review changes, so ratings shown elsewhere can be refreshed */
  onChanged?: () => void;
}

/** Scale and comment size. Keep in sync with the API's server/src/config.js */
const REVIEW = { minRating: 1, maxRating: 5, commentMax: 500 } as const;
const STARS = [1, 2, 3, 4, 5];
const STAR_LABELS = ['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];

const formatAverage = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const formatDate = (day: string) => {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Stars: React.FC<{ rating: number; className?: string }> = ({ rating, className = 'text-[1.125rem]' }) => (
  <span role="img" aria-label={`${rating} de ${REVIEW.maxRating} estrelas`} className="flex shrink-0">
    {STARS.map((star) => (
      <span
        key={star}
        aria-hidden="true"
        className={`material-symbols-outlined ${className} ${star <= Math.round(rating) ? 'fill-1 text-amber-500' : 'text-[#cbc3d7]'}`}
      >
        star
      </span>
    ))}
  </span>
);

/**
 * What patients say about a psychologist: the average, how the ratings spread and the comments.
 * An employee who already had a session with the psychologist can leave, change or remove a review.
 */
export const TherapistReviews: React.FC<TherapistReviewsProps> = ({ therapistId, therapistName, onChanged }) => {
  const showToast = useToast();
  const isOwner = therapistId === undefined;
  const path = isOwner ? '/psi/reviews' : `/psychologists/${therapistId}/reviews`;

  const [listing, setListing] = useState<ReviewListing | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setListing(await api<ReviewListing>('GET', path));
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }, [path]);

  useEffect(() => {
    setListing(null);
    load();
  }, [load]);

  if (loadError) {
    return (
      <section className="card flex flex-col items-start gap-2">
        <h2 className="font-sora text-base font-bold text-[#0b1c30]">Avaliações</h2>
        <p role="alert" className="font-outfit text-sm text-[#93000a]">{loadError}</p>
        <button onClick={load} className="h-10 px-4 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be] font-outfit text-sm font-semibold transition-colors">
          Tentar de novo
        </button>
      </section>
    );
  }
  if (!listing) {
    return (
      <section className="card" aria-busy="true">
        <h2 className="font-sora text-base font-bold text-[#0b1c30]">Avaliações</h2>
        <p className="font-outfit text-sm text-[#7b7486] mt-1">Carregando...</p>
      </section>
    );
  }

  const { summary, reviews } = listing;
  const mine = reviews.find((review) => review.mine);
  const showForm = !isOwner && listing.canReview && (isEditing || !mine);

  const startEditing = () => {
    setRating(mine?.rating ?? null);
    setComment(mine?.comment ?? '');
    setConfirmingDelete(false);
    setIsEditing(true);
  };

  const closeForm = () => {
    setIsEditing(false);
    setRating(null);
    setComment('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === null) return;
    setIsSaving(true);
    try {
      setListing(await api<ReviewListing>('PUT', `/psychologists/${therapistId}/review`, { rating, comment: comment.trim() }));
      showToast(mine ? 'Avaliação atualizada.' : 'Avaliação publicada. Obrigado!');
      closeForm();
      onChanged?.();
    } catch (err) {
      showToast(errorMessage(err), 'info');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setListing(await api<ReviewListing>('DELETE', `/psychologists/${therapistId}/review`));
      showToast('Avaliação excluída.');
      closeForm();
      onChanged?.();
    } catch (err) {
      showToast(errorMessage(err), 'info');
    } finally {
      setConfirmingDelete(false);
    }
  };

  const actionClass = 'h-9 px-3 rounded-full font-outfit text-xs font-semibold transition-colors flex items-center gap-1';

  return (
    <section className="card flex flex-col gap-5">
      <h2 className="font-sora text-base font-bold text-[#0b1c30]">
        {isOwner ? 'O que os pacientes dizem' : 'Avaliações'}
      </h2>

      {/* Resumo */}
      {summary.count > 0 ? (
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex flex-col items-start gap-1">
            <span className="font-sora text-5xl font-bold text-[#0b1c30] tracking-tight tabular-nums leading-none">
              {formatAverage(summary.average)}
            </span>
            <Stars rating={summary.average} className="text-[1.375rem]" />
            <span className="font-outfit text-sm text-[#494454]">
              {summary.count} {summary.count === 1 ? 'avaliação' : 'avaliações'}
            </span>
          </div>

          <ul aria-label="Avaliações por número de estrelas" className="flex flex-col gap-1 flex-1 basis-48 min-w-0">
            {[...STARS].reverse().map((star) => {
              const amount = summary.distribution[star] ?? 0;
              return (
                <li key={star} className="flex items-center gap-2 font-outfit text-xs text-[#494454] tabular-nums">
                  <span className="w-3 text-right shrink-0">{star}</span>
                  <span aria-hidden="true" className="material-symbols-outlined text-[0.9375rem] fill-1 text-amber-500 shrink-0">star</span>
                  <span className="h-2 rounded-full bg-[#eff4ff] flex-1 overflow-hidden">
                    <span className="block h-full rounded-full bg-amber-400" style={{ width: `${(amount / summary.count) * 100}%` }} />
                  </span>
                  <span className="w-6 shrink-0">{amount}</span>
                  <span className="sr-only">{amount === 1 ? 'avaliação' : 'avaliações'}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="p-4 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff] font-outfit text-sm text-[#494454] text-center">
          {isOwner
            ? 'Você ainda não recebeu avaliações. Elas aparecem aqui quando um paciente avaliar você.'
            : 'Este psicólogo ainda não tem avaliações.'}
        </p>
      )}

      {/* Avaliar */}
      {showForm && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 rounded-2xl border border-[#e5eeff]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-sora text-base font-bold text-[#0b1c30]">
              {mine ? 'Alterar sua avaliação' : `Avalie ${therapistName ?? 'o seu psicólogo'}`}
            </h3>
            {mine && (
              <button type="button" onClick={closeForm} className={`${actionClass} text-[#494454] hover:bg-[#eff4ff]`}>
                Cancelar
              </button>
            )}
          </div>

          <fieldset className="flex flex-col gap-1">
            <legend className="font-outfit text-sm font-semibold text-[#0b1c30] mb-1.5">Sua nota</legend>
            <div className="flex items-center gap-1 flex-wrap">
              {STARS.map((star) => (
                <label
                  key={star}
                  className="w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#fff8e8] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#6b38d4]"
                >
                  <input
                    type="radio"
                    name="review-rating"
                    aria-label={`${star} ${star === 1 ? 'estrela' : 'estrelas'}: ${STAR_LABELS[star]}`}
                    checked={star === rating}
                    onChange={() => setRating(star)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`material-symbols-outlined text-[2rem] ${
                      rating !== null && star <= rating ? 'fill-1 text-amber-500' : 'text-[#cbc3d7]'
                    }`}
                  >
                    star
                  </span>
                </label>
              ))}
              <span aria-hidden="true" className="font-outfit text-sm font-semibold text-[#494454] pl-2">
                {rating !== null && STAR_LABELS[rating]}
              </span>
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="review-comment" className="font-outfit text-sm font-semibold text-[#0b1c30] flex items-baseline justify-between gap-2">
              Comentário (opcional)
              <span className="text-xs font-normal text-[#7b7486] tabular-nums">
                {comment.length}/{REVIEW.commentMax}
              </span>
            </label>
            <textarea
              id="review-comment"
              rows={3}
              maxLength={REVIEW.commentMax}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Como tem sido o seu acompanhamento?"
              className="p-3 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff] text-base font-outfit text-[#0b1c30] placeholder:text-[#7b7486] resize-none focus:outline-none focus:border-[#6b38d4] focus:ring-2 focus:ring-[#6b38d4]/20"
            />
          </div>

          <p className="flex items-start gap-2 font-outfit text-xs text-[#7b7486] leading-snug">
            <span className="material-symbols-outlined text-[1.125rem] text-[#0051d5] shrink-0">lock</span>
            A avaliação aparece sem o seu nome para os colegas e para o psicólogo. Evite escrever algo que identifique você.
          </p>

          <button
            type="submit"
            disabled={rating === null || isSaving}
            className="min-h-11 px-5 py-1.5 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-semibold transition-all active:scale-[0.98] disabled:bg-[#cbc3d7] disabled:active:scale-100"
          >
            {isSaving ? 'Enviando...' : mine ? 'Salvar alteração' : 'Publicar avaliação'}
          </button>
        </form>
      )}

      {!isOwner && !listing.canReview && listing.reason === 'no_session_yet' && (
        <p className="p-3 rounded-2xl bg-[#eff4ff] font-outfit text-sm text-[#494454] flex items-start gap-2">
          <span className="material-symbols-outlined text-[1.25rem] text-[#0051d5] shrink-0">info</span>
          Você poderá avaliar depois da sua primeira sessão.
        </p>
      )}

      {/* Comentários */}
      {reviews.length > 0 && (
        <ul aria-label="Comentários" className="flex flex-col gap-2">
          {reviews.map((review) => (
            <li
              key={review.id}
              className={`p-3 rounded-2xl border flex flex-col gap-1.5 ${
                review.mine ? 'border-[#6b38d4]/40 bg-[#fbf9ff]' : 'border-[#e5eeff] bg-[#f8f9ff]'
              }`}
            >
              <div className="flex items-center gap-x-3 gap-y-1 flex-wrap font-outfit text-xs text-[#494454]">
                <Stars rating={review.rating} />
                <span>{formatDate(review.date)}</span>
                {review.mine && (
                  <span className="px-2 py-0.5 rounded-full bg-[#6b38d4] text-white font-semibold">Sua avaliação</span>
                )}
              </div>
              {review.comment && (
                <p className="font-outfit text-sm text-[#0b1c30] leading-relaxed whitespace-pre-wrap break-words">
                  {review.comment}
                </p>
              )}
              {review.mine && !isEditing && (
                <div className="flex items-center gap-1 flex-wrap -ml-3">
                  {confirmingDelete ? (
                    <>
                      <span className="font-outfit text-xs text-[#ba1a1a] pl-3 pr-1">Excluir a sua avaliação?</span>
                      <button type="button" onClick={handleDelete} className={`${actionClass} bg-[#ba1a1a] text-white hover:bg-[#93000a]`}>
                        Excluir
                      </button>
                      <button type="button" onClick={() => setConfirmingDelete(false)} className={`${actionClass} text-[#494454] hover:bg-white`}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      {listing.canReview && (
                        <button type="button" onClick={startEditing} className={`${actionClass} text-[#5516be] hover:bg-white`}>
                          <span className="material-symbols-outlined text-[1.125rem]">edit</span>
                          Alterar
                        </button>
                      )}
                      <button type="button" onClick={() => setConfirmingDelete(true)} className={`${actionClass} text-[#ba1a1a] hover:bg-white`}>
                        <span className="material-symbols-outlined text-[1.125rem]">delete</span>
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOwner && summary.count > 0 && (
        <p className="flex items-start gap-2 font-outfit text-xs text-[#7b7486] leading-snug">
          <span className="material-symbols-outlined text-[1.125rem] text-[#0051d5] shrink-0">lock</span>
          As avaliações chegam sem o nome de quem escreveu.
        </p>
      )}
    </section>
  );
};
