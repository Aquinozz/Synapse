import React from 'react';

interface LoadingScreenProps {
  /** Shown instead of the spinner when loading failed */
  error?: string | null;
  onRetry?: () => void;
}

/** Full-area placeholder while data is on its way, with a retry when it fails */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ error, onRetry }) => (
  <div className="min-h-[60vh] flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center font-outfit bg-[#f8f9ff]">
    {error ? (
      <>
        <span className="material-symbols-outlined text-[2.5rem] text-[#ba1a1a]">error</span>
        <p className="text-sm text-[#494454] max-w-xs" role="alert">
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="h-11 px-5 rounded-full bg-[#6b38d4] hover:bg-[#8455ef] text-white text-sm font-semibold transition-colors"
          >
            Tentar de novo
          </button>
        )}
      </>
    ) : (
      <>
        <span className="material-symbols-outlined text-[2.25rem] text-[#6b38d4] animate-spin">progress_activity</span>
        <span className="sr-only" role="status">
          Carregando
        </span>
      </>
    )}
  </div>
);
