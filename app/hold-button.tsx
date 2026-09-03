'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A button that fires only after a sustained press. Opening a listing is a
 * separate shopper gesture from prepare_selection, so a stray click, or an
 * in-app browser pressing the page's own button, does nothing.
 */
export function HoldButton({
  label,
  holdMs = 700,
  onConfirm,
  disabled = false,
}: {
  label: string;
  holdMs?: number;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [holding, setHolding] = useState(false);
  const [pending, setPending] = useState(false);
  const timer = useRef<number | null>(null);

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    setHolding(false);
  }, []);

  const start = useCallback(() => {
    if (disabled || pending || timer.current !== null) return;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setHolding(false);
      setPending(true);
      try {
        onConfirm();
      } finally {
        setPending(false);
      }
    }, holdMs);
  }, [disabled, holdMs, onConfirm, pending]);

  useEffect(() => cancel, [cancel]);

  return (
    <button
      type="button"
      aria-label={`${label} (press and hold)`}
      disabled={disabled || pending}
      onPointerDown={event => {
        if (event.button !== 0) return;
        start();
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={event => {
        if (event.key === ' ' && !event.repeat) {
          event.preventDefault();
          start();
        }
      }}
      onKeyUp={event => {
        if (event.key === ' ') cancel();
      }}
      onBlur={cancel}
      className="relative overflow-hidden rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white select-none disabled:opacity-60"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-white/30"
        style={{
          width: holding ? '100%' : '0%',
          transition: holding ? `width ${holdMs}ms linear` : 'none',
        }}
      />
      <span className="relative">{label}</span>
    </button>
  );
}
