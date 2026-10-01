import React, { useState } from 'react';
import { errorMessage } from '../../api/client';
import { Avatar } from '../../components/Avatar';
import { PhotoPicker } from '../../components/PhotoPicker';
import { TherapistCard } from '../../components/TherapistCard';
import { TherapistReviews } from '../../components/TherapistReviews';
import { useToast } from '../../components/Toast';
import { ProfileCatalog, Therapist } from '../../types';

/** What the psychologist can edit on the public profile */
export type ProfileChanges = Pick<Therapist, 'bio' | 'specialties' | 'approaches' | 'languages'>;

interface PsiProfileScreenProps {
  /** The profile as employees see it */
  profile: Therapist;
  /** The options the profile can list */
  catalog: ProfileCatalog;
  /** Saves to the API; rejects with an ApiError */
  onSave: (changes: ProfileChanges) => Promise<void>;
  /** Saves the profile photo (a data URL) or removes it with null; rejects with an ApiError */
  onSavePhoto: (image: string | null) => Promise<void>;
  onLogout: () => void;
}

const BIO_LIMIT = 220;

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((item) => b.includes(item));

const known = (list: string[], options: string[]) => list.filter((item) => options.includes(item));

interface ChipGroupProps {
  options: string[];
  selected: string[];
  /** No more can be added once the limit is reached */
  max: number;
  onChange: (selected: string[]) => void;
}

/** Toggle chips for picking several options, up to a limit */
const ChipGroup: React.FC<ChipGroupProps> = ({ options, selected, max, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((option) => {
      const isSelected = selected.includes(option);
      return (
        <button
          key={option}
          type="button"
          aria-pressed={isSelected}
          disabled={!isSelected && selected.length >= max}
          onClick={() => onChange(isSelected ? selected.filter((o) => o !== option) : [...selected, option])}
          className={`min-h-10 px-3.5 py-1.5 rounded-full font-outfit text-sm font-semibold border transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100 ${
            isSelected
              ? 'bg-[#6b38d4] text-white border-[#6b38d4]'
              : 'bg-white text-[#0b1c30] border-[#e5eeff] hover:border-[#6b38d4]/30'
          }`}
        >
          {option}
        </button>
      );
    })}
  </div>
);

const SectionTitle: React.FC<{ id?: string; title: string; count: number; max: number }> = ({ id, title, count, max }) => (
  <div className="flex items-baseline justify-between gap-2">
    <h2 id={id} className="font-sora text-base font-bold text-[#0b1c30]">
      {title}
    </h2>
    <span className="font-outfit text-xs text-[#7b7486] tabular-nums">
      {count} de {max}
    </span>
  </div>
);

export const PsiProfileScreen: React.FC<PsiProfileScreenProps> = ({
  profile,
  catalog,
  onSave,
  onSavePhoto,
  onLogout,
}) => {
  const showToast = useToast();
  // Edits stay in a draft until saved; the preview follows the draft
  const [bio, setBio] = useState(profile.bio);
  // Profiles older than the catalog may list labels it does not have; the draft leaves them out
  const [specialties, setSpecialties] = useState(() =>
    known(profile.specialties, catalog.specialtyGroups.flatMap((group) => group.items))
  );
  const [approaches, setApproaches] = useState(() => known(profile.approaches, catalog.approaches));
  const [languages, setLanguages] = useState(() => known(profile.languages, catalog.languages));
  const [isSaving, setIsSaving] = useState(false);

  const isDirty =
    bio.trim() !== profile.bio ||
    !sameList(specialties, profile.specialties) ||
    !sameList(approaches, profile.approaches) ||
    !sameList(languages, profile.languages);
  const isValid = specialties.length > 0 && languages.length > 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ bio: bio.trim(), specialties, approaches, languages });
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
        <form onSubmit={handleSave} className="card flex flex-col gap-6 lg:col-span-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Avatar name={profile.name} image={profile.avatar} className="w-20 h-20 text-2xl !rounded-2xl" />
            <div className="flex flex-col min-w-0 flex-1 basis-40 font-outfit">
              <span className="font-sora text-lg font-bold text-[#0b1c30]">{profile.name}</span>
              <span className="text-sm text-[#494454]">{profile.title}</span>
              <span className="text-xs text-[#003ea8] font-semibold flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[1.0625rem]">
                  {profile.status === 'active' ? 'verified' : 'hourglass_top'}
                </span>
                {profile.reg} {profile.status === 'active' ? 'verificado' : 'em análise'}
              </span>
            </div>
            <PhotoPicker hasPhoto={Boolean(profile.avatar)} onSave={onSavePhoto} className="basis-full" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-bio" className="font-sora text-base font-bold text-[#0b1c30] flex items-baseline justify-between">
              Apresentação
              <span className="font-outfit text-xs font-normal text-[#7b7486] tabular-nums">
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

          <div className="flex flex-col gap-3">
            <SectionTitle title="Especialidades" count={specialties.length} max={catalog.limits.specialties} />
            {catalog.specialtyGroups.map((group) => (
              <fieldset key={group.name} className="flex flex-col gap-2">
                <legend className="font-outfit text-sm font-semibold text-[#494454] mb-2">{group.name}</legend>
                <ChipGroup
                  options={group.items}
                  selected={specialties}
                  max={catalog.limits.specialties}
                  onChange={setSpecialties}
                />
              </fieldset>
            ))}
          </div>

          <div role="group" aria-labelledby="approaches-title" className="flex flex-col gap-3">
            <SectionTitle id="approaches-title" title="Abordagens" count={approaches.length} max={catalog.limits.approaches} />
            <ChipGroup
              options={catalog.approaches}
              selected={approaches}
              max={catalog.limits.approaches}
              onChange={setApproaches}
            />
          </div>

          <div role="group" aria-labelledby="languages-title" className="flex flex-col gap-3">
            <SectionTitle id="languages-title" title="Idiomas de atendimento" count={languages.length} max={catalog.limits.languages} />
            <ChipGroup
              options={catalog.languages}
              selected={languages}
              max={catalog.limits.languages}
              onChange={setLanguages}
            />
          </div>

          {!isValid && (
            <p role="alert" className="font-outfit text-sm text-[#93000a]">
              Escolha pelo menos uma especialidade e um idioma.
            </p>
          )}

          {/* Stays in reach while the long list scrolls; the white band keeps the chips from showing through */}
          <div className="sticky bottom-20 lg:bottom-0 -mx-2 -mb-2 px-2 pt-3 pb-2 lg:pb-4 bg-white/95 backdrop-blur-sm rounded-b-3xl flex flex-col">
            <button
              type="submit"
              disabled={!isDirty || !isValid || isSaving}
              className="h-12 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white font-outfit text-sm font-bold shadow-lg transition-all active:scale-[0.98] disabled:bg-[#cbc3d7] disabled:shadow-none disabled:active:scale-100"
            >
              {isSaving ? 'Salvando...' : isDirty ? 'Salvar alterações' : 'Tudo salvo'}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-3 lg:col-span-2 lg:sticky lg:top-24">
          <h2 className="font-sora text-base font-bold text-[#0b1c30]">Prévia no app do funcionário</h2>
          <TherapistCard therapist={{ ...profile, bio, specialties, approaches, languages }} />
          <p className="font-outfit text-xs text-[#7b7486]">Os horários livres vêm da sua agenda semanal.</p>

          <button
            onClick={onLogout}
            className="lg:hidden h-11 rounded-full text-[#ba1a1a] hover:bg-[#ffdad6]/50 font-outfit text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[1.25rem]">logout</span>
            Sair
          </button>
        </div>
      </div>

      <TherapistReviews />
    </div>
  );
};
