import React, { useRef, useState } from 'react';
import { errorMessage } from '../api/client';
import { PhotoEditorModal } from './PhotoEditorModal';
import { useToast } from './Toast';

/** Largest picture accepted for editing; the saved photo is a small crop of it */
const MAX_FILE_BYTES = 15 * 1024 * 1024;

interface PhotoPickerProps {
  hasPhoto: boolean;
  /** Saves the adjusted photo (a data URL) or removes it with null; rejects with an ApiError */
  onSave: (image: string | null) => Promise<void>;
  className?: string;
}

/**
 * The "add / change / remove photo" controls, shared by the employee's and the
 * psychologist's profile: picks a file, opens the editor and reports the result.
 */
export const PhotoPicker: React.FC<PhotoPickerProps> = ({ hasPhoto, onSave, className = '' }) => {
  const showToast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    // Lets the same file be chosen again later
    e.target.value = '';
    if (!chosen) return;
    if (!chosen.type.startsWith('image/')) {
      showToast('Escolha um arquivo de imagem (JPG ou PNG).', 'info');
      return;
    }
    if (chosen.size > MAX_FILE_BYTES) {
      showToast('A imagem é grande demais. Escolha uma de até 15 MB.', 'info');
      return;
    }
    setFile(chosen);
  };

  const handleRemove = async () => {
    try {
      await onSave(null);
      showToast('Foto removida.');
    } catch (err) {
      showToast(errorMessage(err), 'info');
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <input
        ref={input}
        type="file"
        accept="image/*"
        onChange={handleFileChosen}
        aria-label="Escolher foto de perfil"
        className="sr-only"
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="h-10 px-4 rounded-full bg-[#eff4ff] hover:bg-[#dce9ff] text-[#5516be] font-outfit text-sm font-semibold transition-colors flex items-center gap-1.5"
      >
        <span className="material-symbols-outlined text-[1.25rem]">photo_camera</span>
        {hasPhoto ? 'Trocar foto' : 'Adicionar foto'}
      </button>
      {hasPhoto && (
        <button
          type="button"
          onClick={handleRemove}
          className="h-10 px-3 rounded-full text-[#ba1a1a] hover:bg-[#ffdad6]/50 font-outfit text-sm font-semibold transition-colors"
        >
          Remover
        </button>
      )}

      <PhotoEditorModal
        file={file}
        onClose={() => setFile(null)}
        onSave={async (image) => {
          await onSave(image);
          showToast('Foto de perfil atualizada.');
        }}
      />
    </div>
  );
};
