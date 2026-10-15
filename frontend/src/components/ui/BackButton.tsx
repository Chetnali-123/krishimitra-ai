import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export interface BackButtonProps {
  fallbackTo?: string;
  /** Accessibility label. If omitted, we use a generic "Go back" label. */
  ariaLabel?: string;
  className?: string;
}

function hasRouterHistory(): boolean {
  if (typeof window === 'undefined') return false;
  const state = window.history.state as { idx?: number } | null;
  if (typeof state?.idx === 'number') return state.idx > 0;
  return window.history.length > 1;
}

/**
 * Minimal "←" back arrow, modelled after WhatsApp's small back control.
 * Renders as a compact icon-only button with accessible labelling.
 */
export function BackButton({ fallbackTo = '/', ariaLabel = 'Go back', className = '' }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    if (hasRouterHistory()) navigate(-1);
    else navigate(fallbackTo, { replace: true });
  }, [fallbackTo, navigate]);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={handleClick}
      className={[
        '-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-900',
        'hover:bg-ink-50/80 active:bg-ink-100',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-crop-500 focus-visible:ring-offset-1',
        'transition-colors',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
