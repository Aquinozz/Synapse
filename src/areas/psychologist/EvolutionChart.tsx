import React, { useLayoutEffect, useRef, useState } from 'react';
import { EVALUATION, Evaluation, formatShortDay } from './evaluations';

interface EvolutionChartProps {
  /** Oldest first */
  evaluations: Evaluation[];
  patientName: string;
}

/** The chart shows the most recent sessions; older ones stay in the list below it */
const MAX_POINTS = 12;
const HEIGHT = 190;
const PAD = { top: 24, right: 20, bottom: 28, left: 30 };
const TICKS = [2, 4, 6, 8, 10];
const MAX_DAY_LABELS = 6;

const formatAverage = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Line chart of the scores the psychologist gave, session by session */
export const EvolutionChart: React.FC<EvolutionChartProps> = ({ evaluations, patientName }) => {
  const frameRef = useRef<HTMLDivElement>(null);
  // Drawn at the real pixel width, so the labels keep the size of the rest of the text
  const [width, setWidth] = useState(320);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => setWidth(Math.max(240, frame.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const points = evaluations.slice(-MAX_POINTS);
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return null;

  // The first point sits a little to the right of the axis, clear of its numbers
  const plotLeft = PAD.left + 14;
  const innerWidth = width - plotLeft - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) => plotLeft + (points.length === 1 ? innerWidth / 2 : (index * innerWidth) / (points.length - 1));
  const y = (score: number) =>
    PAD.top + ((EVALUATION.maxScore - score) / (EVALUATION.maxScore - EVALUATION.minScore)) * innerHeight;

  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(point.score).toFixed(1)}`).join(' ');
  const baseline = PAD.top + innerHeight;
  const area = `${line} L${x(points.length - 1).toFixed(1)},${baseline} L${x(0).toFixed(1)},${baseline} Z`;
  const labelEvery = Math.ceil(points.length / MAX_DAY_LABELS);

  const average = points.reduce((sum, point) => sum + point.score, 0) / points.length;
  const change = last.score - first.score;
  const trend =
    points.length < 2
      ? 'Primeira avaliação'
      : change === 0
      ? 'Igual à primeira'
      : `${change > 0 ? '+' : '−'}${Math.abs(change)} desde a primeira`;
  const trendTone = change > 0 ? 'text-[#005236]' : change < 0 ? 'text-[#ba1a1a]' : 'text-[#494454]';

  const description =
    points.length === 1
      ? `Evolução de ${patientName}: uma sessão avaliada, nota ${first.score} em ${formatShortDay(first.date)}.`
      : `Evolução de ${patientName}: ${points.length} sessões avaliadas, de nota ${first.score} em ${formatShortDay(first.date)} a nota ${last.score} em ${formatShortDay(last.date)}. Média ${formatAverage(average)}.`;

  return (
    <figure className="rounded-2xl bg-[#f8f9ff] border border-[#e5eeff] p-3 flex flex-col gap-2">
      <figcaption className="grid grid-cols-3 gap-2 font-outfit">
        <Stat label="Última nota" value={String(last.score)} />
        <Stat label="Média" value={formatAverage(average)} />
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-[#494454]">Tendência</span>
          <span className={`text-sm font-semibold leading-tight pt-1 ${trendTone}`}>{trend}</span>
        </div>
      </figcaption>

      <div ref={frameRef} className="w-full">
        <svg width={width} height={HEIGHT} role="img" aria-label={description} className="block font-outfit">
          <defs>
            <linearGradient id="evolution-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6b38d4" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#6b38d4" stopOpacity="0" />
            </linearGradient>
          </defs>

          {TICKS.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} stroke="#dce9ff" strokeWidth="1" />
              <text x={PAD.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" className="text-2xs fill-[#7b7486]">
                {tick}
              </text>
            </g>
          ))}

          {points.length > 1 && (
            <>
              <path d={area} fill="url(#evolution-fill)" />
              <path d={line} fill="none" stroke="#6b38d4" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            </>
          )}

          {points.map((point, index) => (
            <g key={point.date}>
              <circle cx={x(index)} cy={y(point.score)} r="4.5" fill="#fff" stroke="#6b38d4" strokeWidth="2.5" />
              <text x={x(index)} y={y(point.score) - 10} textAnchor="middle" className="text-2xs font-bold fill-[#0b1c30]">
                {point.score}
              </text>
              {(points.length - 1 - index) % labelEvery === 0 && (
                <text x={x(index)} y={HEIGHT - 8} textAnchor="middle" className="text-2xs fill-[#494454]">
                  {formatShortDay(point.date)}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {evaluations.length > MAX_POINTS && (
        <p className="font-outfit text-xs text-[#7b7486]">O gráfico mostra as {MAX_POINTS} sessões mais recentes.</p>
      )}
    </figure>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col min-w-0">
    <span className="text-xs text-[#494454]">{label}</span>
    <span className="font-sora text-2xl font-bold text-[#0b1c30] tabular-nums leading-tight">{value}</span>
  </div>
);
