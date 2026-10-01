import React, { useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { TherapistCard } from '../../components/TherapistCard';
import { errorMessage } from '../../api/client';
import { useToast } from '../../components/Toast';
import { SPECIALTIES } from '../../data/psychologistMock';
import { Therapist } from '../../types';

interface PsiProfileScreenProps {
  /** The profile as employees see it */
  profile: Therapist;
  /** Saves to the API; rejects with an ApiError */
  onSave: (bio: string, tags: Therapist['tags']) => Promise<void>;
  onLogout: () => void;
}

const BIO_LIMIT = 220;
const MAX_SPECIALTIES = 4;

export const PsiProfileScreen: React.FC<PsiProfileScreenProps> = ({
  profile,
  onSave,
  onLogout,
}) => {
  const showToast = useToast();
  // Edits stay in a draft until saved; the preview follows the draft
  const [bio, setBio] = useState(profile.bio);
  const [tags, setTags] = useState(profile.tags);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty =
    bio.trim() !== profile.bio ||
    tags.map((t) => t.label).join('|') !== profile.tags.map((t) => t.label).join('|');
  const selectedLabels = tags.map((t) => t.label);

  const toggleSpecialty = (specialty: { label: string; icon: string }) => {
    if (selectedLabels.includes(specialty.label)) {
      setTags(tags.filter((t) => t.label !== specialty.label));
    } else if (tags.length < MAX_SPECIALTIES) {
      setTags([...tags, specialty]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(bio.trim(), tags);
      showToast(
        profile.status === 'active'
          ? 'Perfil atualizado. Os funcionários já veem a nova versão.'
          : 'Perfil salvo. Ele aparece para os funcionários após a conferência do registro.'
      );
    } catch (err) {
      showToast(errorMessage(err), 'info');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="screen">
      <section className="flex flex-col">
        <h1 className="font-sora text-2xl lg:text-3xl font-bold text-[#0b1c30] tracking-tight">Perfil profissional</h1>
        <p className="font-outfit text-sm lg:text-base text-[#494454]">
          É assim que os funcionários conhecem você antes de escolher um horário.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 items-start">
        <form onSubmit={handleSave} className="card flex flex-col gap-5 lg:col-span-3">
          <div className="flex items-center gap-3">
            <Avatar name={profile.name} image={profile.avatar} className="w-16 h-16 text-xl !rounded-2xl" />
            <div className="flex flex-col min-w-0 font-outfit">
              <span className="font-sora text-lg font-bold text-[#0b1c30]">{profile.name}</span>
              <span className="text-sm text-[#494454]">{profile.title}</span>
              <span className="text-xs text-[#003ea8] font-semibold flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[15px]">
                  {profile.status === 'active' ? 'verified' : 'hourglass_top'}
                </span>
                {profile.reg} {profile.status === 'active' ? 'verificado' : 'em análise'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-bio" className="font-outfit text-sm font-semibold text-[#0b1c30] flex items-center justify-between">
              Apresentação
              <span className="text-xs font-normal text-[#7b7486] tabular-nums">
                {bio.length}/{BIO_LIMIT}
              </span>
            </label>
            <textarea
              id="profile-bio"
              rows={4}
              maxLength={BIO_LIMIT}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="p-4 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff] text-base font-outfit text-[#0b1c30] resize-none focus:outline-none focus:border-[#6b38d4] focus:ring-2 focus:ring-[#6b38d4]/20"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span id="specialties-label" className="font-outfit text-sm font-semibold text-[#0b1c30] flex items-center justify-between">
              Especialidades
              <span className="text-xs font-normal text-[#7b7486]">
                {tags.length} de {MAX_SPECIALTIES}
              </span>
            </span>
            <div role="group" aria-labelledby="specialties-label" className="flex flex-wrap gap-2">
              {SPECIALTIES.map((specialty) => {
                const isSelected = selectedLabels.includes(specialty.label);
                const isBlocked = !isSelected && tags.length >= MAX_SPECIALTIES;
                return (
                  <button
                    key={specialty.label}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={isBlocked}
                    onClick={() => toggleSpecialty(specialty)}
                    className={`h-10 px-3.5 rounded-full font-outfit text-sm font-semibold flex items-center gap-1.5 border transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100 ${
                      isSelected
                        ? 'bg-[#6b38d4] text-white border-[#6b38d4]'
                        : 'bg-white text-[#0b1c30] border-[#e5eeff] hover:border-[#6b38d4]/30'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[18px] ${isSelected ? '' : 'text-[#6b38d4]'}`}>
                      {specialty.icon}
                    </span>
                    {specialty.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isDirty || tags.length === 0 || isSaving}
            className="h-12 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-bold transition-all active:scale-[0.98] disabled:bg-[#cbc3d7] disabled:active:scale-100"
          >
            {isSaving ? 'Salvando...' : isDirty ? 'Salvar alterações' : 'Tudo salvo'}
          </button>
        </form>

        <div className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="font-sora text-base font-bold text-[#0b1c30]">Prévia no app do funcionário</h2>
          <TherapistCard therapist={{ ...profile, bio, tags }} />
          <p className="font-outfit text-xs text-[#7b7486]">
            Os horários livres vêm da sua agenda semanal.
          </p>

          <button
            onClick={onLogout}
            className="lg:hidden h-11 rounded-full text-[#ba1a1a] hover:bg-[#ffdad6]/50 font-outfit text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};
