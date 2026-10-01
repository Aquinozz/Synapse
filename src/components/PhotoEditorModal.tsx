import React, { useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client';
import { Modal, ModalCloseButton } from './Modal';

interface PhotoEditorModalProps {
  /** The picture chosen by the person; the editor is open while there is one */
  file: File | null;
  onClose: () => void;
  /** Receives the adjusted photo as a small JPEG data URL; rejects when saving fails */
  onSave: (image: string) => Promise<void>;
}

/** Side of the square crop area on screen, in px */
const VIEWPORT = 256;
/** Side of the saved photo, in px: sharp on dense screens at avatar sizes, and light to store */
const OUTPUT = 320;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const MOVE_STEP = 12;

export const PhotoEditorModal: React.FC<PhotoEditorModalProps> = ({ file, onClose, onSave }) => (
  <Modal isOpen={file !== null} onClose={onClose} label="Ajustar foto de perfil" maxWidth="max-w-sm" className="gap-4 items-center">
    {file && <PhotoEditor file={file} onClose={onClose} onSave={onSave} />}
  </Modal>
);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const PhotoEditor: React.FC<{ file: File; onClose: () => void; onSave: (image: string) => Promise<void> }> = ({
  file,
  onClose,
  onSave,
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  // How far the picture is moved from the centre of the crop area, in screen px
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{ pointerId: number; startX: number; startY: number; origin: { x: number; y: number } } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setImage(img);
    img.onerror = () => setFailed(true);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // At zoom 1 the picture just covers the crop area, whatever its proportions
  const baseScale = image ? Math.max(VIEWPORT / image.naturalWidth, VIEWPORT / image.naturalHeight) : 1;
  const scale = baseScale * zoom;
  const width = image ? image.naturalWidth * scale : VIEWPORT;
  const height = image ? image.naturalHeight * scale : VIEWPORT;

  /** Keeps the picture covering the whole crop area: no empty corners in the saved photo */
  const limit = (next: { x: number; y: number }, w = width, h = height) => ({
    x: clamp(next.x, -(w - VIEWPORT) / 2, (w - VIEWPORT) / 2),
    y: clamp(next.y, -(h - VIEWPORT) / 2, (h - VIEWPORT) / 2),
  });

  const changeZoom = (next: number) => {
    const value = clamp(next, MIN_ZOOM, MAX_ZOOM);
    setZoom(value);
    if (image) {
      setOffset((current) =>
        limit(current, image.naturalWidth * baseScale * value, image.naturalHeight * baseScale * value)
      );
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, origin: offset };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== e.pointerId) return;
    setOffset(limit({ x: current.origin.x + e.clientX - current.startX, y: current.origin.y + e.clientY - current.startY }));
  };

  const handlePointerUp = () => {
    drag.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-MOVE_STEP, 0],
      ArrowRight: [MOVE_STEP, 0],
      ArrowUp: [0, -MOVE_STEP],
      ArrowDown: [0, MOVE_STEP],
    };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      setOffset(limit({ x: offset.x + dx, y: offset.y + dy }));
    } else if (e.key === '+' || e.key === '=') {
      changeZoom(zoom + 0.1);
    } else if (e.key === '-') {
      changeZoom(zoom - 0.1);
    }
  };

  const handleSave = async () => {
    if (!image) return;
    setError(null);
    setIsSaving(true);
    try {
      // The part of the original picture that is inside the crop area
      const left = (VIEWPORT - width) / 2 + offset.x;
      const top = (VIEWPORT - height) / 2 + offset.y;
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      // Transparent pictures get a white background instead of the black JPEG gives them
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, OUTPUT, OUTPUT);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, -left / scale, -top / scale, VIEWPORT / scale, VIEWPORT / scale, 0, 0, OUTPUT, OUTPUT);
      await onSave(canvas.toDataURL('image/jpeg', 0.85));
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message === 'canvas' ? 'Não foi possível preparar a foto.' : errorMessage(err));
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="w-full flex items-center justify-between gap-3">
        <h2 className="font-sora text-lg font-bold text-[#0b1c30]">Ajustar foto</h2>
        <ModalCloseButton onClose={onClose} />
      </div>

      {failed ? (
        <p role="alert" className="w-full p-4 rounded-2xl bg-[#ffdad6]/60 font-outfit text-sm text-[#93000a]">
          Não foi possível abrir esta imagem. Escolha um arquivo JPG ou PNG.
        </p>
      ) : (
        <>
          <div
            role="group"
            aria-label="Área da foto. Arraste para posicionar; as setas do teclado movem a foto e as teclas mais e menos mudam o zoom."
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
            onWheel={(e) => changeZoom(zoom - e.deltaY * 0.002)}
            className="relative shrink-0 overflow-hidden rounded-2xl bg-white cursor-grab active:cursor-grabbing touch-none select-none"
            style={{ width: VIEWPORT, height: VIEWPORT }}
          >
            {image && (
              <img
                src={image.src}
                alt=""
                draggable={false}
                className="absolute max-w-none pointer-events-none"
                style={{
                  width,
                  height,
                  left: (VIEWPORT - width) / 2 + offset.x,
                  top: (VIEWPORT - height) / 2 + offset.y,
                }}
              />
            )}
            {/* Shows how the photo looks in the round avatars; the saved image is the full square */}
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full pointer-events-none ring-2 ring-white shadow-[0_0_0_9999px_rgba(11,28,48,0.55)]"
            />
          </div>

          <p className="font-outfit text-sm text-[#494454] text-center">Arraste a foto para posicionar.</p>

          <div className="w-full flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeZoom(zoom - 0.2)}
              disabled={zoom <= MIN_ZOOM}
              aria-label="Diminuir zoom"
              className="w-11 h-11 shrink-0 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] flex items-center justify-center transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[1.375rem]">zoom_out</span>
            </button>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => changeZoom(Number(e.target.value))}
              aria-label="Zoom da foto"
              className="flex-1 h-11 accent-[#6b38d4] cursor-pointer"
            />
            <button
              type="button"
              onClick={() => changeZoom(zoom + 0.2)}
              disabled={zoom >= MAX_ZOOM}
              aria-label="Aumentar zoom"
              className="w-11 h-11 shrink-0 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] flex items-center justify-center transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[1.375rem]">zoom_in</span>
            </button>
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="w-full p-3 rounded-2xl bg-[#ffdad6]/60 font-outfit text-sm text-[#93000a]">
          {error}
        </p>
      )}

      <div className="w-full flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-12 px-5 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] font-outfit text-sm font-semibold transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!image || isSaving}
          className="flex-1 h-12 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-bold transition-colors disabled:bg-[#cbc3d7]"
        >
          {isSaving ? 'Salvando...' : 'Salvar foto'}
        </button>
      </div>
    </>
  );
};
