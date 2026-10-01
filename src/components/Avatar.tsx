import React from 'react';

interface AvatarProps {
  name: string;
  image?: string | null;
  /** Tailwind size and text classes, e.g. "w-10 h-10 text-sm" */
  className?: string;
}

const initialsOf = (name: string) =>
  name
    .replace(/^Dra?\.\s*/, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

/** Photo when there is one, initials otherwise */
export const Avatar: React.FC<AvatarProps> = ({ name, image, className = 'w-10 h-10 text-sm' }) =>
  image ? (
    <img src={image} alt="" className={`rounded-full object-cover shrink-0 border border-[#e5eeff] ${className}`} />
  ) : (
    <span
      aria-hidden="true"
      className={`rounded-full shrink-0 bg-[#e9ddff] text-[#5516be] font-sora font-bold flex items-center justify-center ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
