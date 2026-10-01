import React from 'react';

export type ColorVisionMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export const COLOR_VISION_MODES: { id: ColorVisionMode; label: string; detail: string }[] = [
  { id: 'none', label: 'Padrão', detail: 'Sem ajuste' },
  { id: 'protanopia', label: 'Protanopia', detail: 'Vermelho' },
  { id: 'deuteranopia', label: 'Deuteranopia', detail: 'Verde' },
  { id: 'tritanopia', label: 'Tritanopia', detail: 'Azul e amarelo' },
];

type Matrix = [number[], number[], number[]];

const IDENTITY: Matrix = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

// How each type of dichromacy perceives linear RGB (Machado, Oliveira & Fernandes, 2009; severity 1.0)
const PERCEIVED: Record<Exclude<ColorVisionMode, 'none'>, Matrix> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

// Where the lost information is moved to: red/green confusion goes to the channels the
// person still tells apart (green and blue); blue/yellow confusion goes to red and green.
const REDISTRIBUTE: Record<Exclude<ColorVisionMode, 'none'>, Matrix> = {
  protanopia: [
    [0, 0, 0],
    [0.7, 1, 0],
    [0.7, 0, 1],
  ],
  deuteranopia: [
    [0, 0, 0],
    [0.7, 1, 0],
    [0.7, 0, 1],
  ],
  tritanopia: [
    [1, 0, 0.7],
    [0, 1, 0.7],
    [0, 0, 0],
  ],
};

const multiply = (a: Matrix, b: Matrix) =>
  a.map((row) => b[0].map((_, col) => row.reduce((sum, value, k) => sum + value * b[k][col], 0))) as Matrix;

/**
 * Daltonization: corrected = colour + redistribute x (colour - perceived colour).
 * The part of each colour the person cannot see is added to channels they can, so two
 * colours that would look the same end up different. It is linear, so it fits one matrix.
 */
const correctionMatrix = (mode: Exclude<ColorVisionMode, 'none'>): Matrix => {
  const lost = IDENTITY.map((row, i) => row.map((value, j) => value - PERCEIVED[mode][i][j])) as Matrix;
  const shift = multiply(REDISTRIBUTE[mode], lost);
  return IDENTITY.map((row, i) => row.map((value, j) => value + shift[i][j])) as Matrix;
};

/** The 4x5 `values` of an feColorMatrix: RGB rows from the matrix, alpha untouched */
const toFilterValues = (matrix: Matrix) =>
  [...matrix.map((row) => [...row.map((v) => v.toFixed(4)), 0, 0].join(' ')), '0 0 0 1 0'].join(' ');

const FILTERS = (Object.keys(PERCEIVED) as Exclude<ColorVisionMode, 'none'>[]).map((mode) => ({
  // Referenced by the rules in index.css
  id: `color-vision-${mode}`,
  values: toFilterValues(correctionMatrix(mode)),
}));

/** SVG filter definitions referenced by the rules in index.css; they render nothing by themselves */
export const ColorVisionFilters: React.FC = () => (
  <svg aria-hidden="true" focusable="false" width="0" height="0" className="absolute">
    <defs>
      {FILTERS.map((filter) => (
        <filter key={filter.id} id={filter.id} colorInterpolationFilters="linearRGB">
          <feColorMatrix type="matrix" values={filter.values} />
        </filter>
      ))}
    </defs>
  </svg>
);
