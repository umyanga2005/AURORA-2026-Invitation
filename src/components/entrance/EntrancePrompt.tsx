import { useEffect, useRef } from 'react';
import type { EntranceState } from '../../types/entrance';

interface EntrancePromptProps {
  entranceState: EntranceState;
  onEnter: () => void;
}

export function EntrancePrompt({ entranceState, onEnter }: EntrancePromptProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const isInteractive =
    entranceState === 'INITIALIZING' || entranceState === 'ENTRANCE_READY';

  const isPromptVisible =
    entranceState === 'ENTRANCE_READY' || entranceState === 'INITIALIZING';

  // Keyboard support (Enter / Space) anywhere while entrance is ready
  useEffect(() => {
    if (!isInteractive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        // Don't hijack Space/Enter if focus is explicitly on the Fullscreen button
        const activeTag = document.activeElement;
        if (activeTag && activeTag.classList.contains('fullscreen-toggle-btn')) {
          return;
        }
        e.preventDefault();
        onEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInteractive, onEnter]);

  if (entranceState === 'INVITATION_VISIBLE') return null;

  return (
    <div
      className={`entrance-overlay ${
        isPromptVisible ? 'entrance-overlay-active' : 'entrance-overlay-exiting'
      }`}
    >
      <button
        ref={buttonRef}
        type="button"
        className="entrance-hit-button"
        onClick={onEnter}
        disabled={!isInteractive}
        aria-label="The Gates of Olympus — Tap to enter AURORA 2026 Digital Invitation"
      >
        <div
          className={`entrance-prompt-stack ${
            entranceState === 'ENTRANCE_READY' ? 'prompt-revealed' : 'prompt-awakening'
          }`}
        >
          <span className="entrance-kicker">THE GATES OF OLYMPUS</span>
          <span className="entrance-cta">
            <span className="entrance-cta-dot" aria-hidden="true" />
            TAP TO ENTER
            <span className="entrance-cta-dot" aria-hidden="true" />
          </span>
          <span className="entrance-sub">A JOURNEY INTO THE WORLD OF LEGENDS</span>
        </div>
      </button>
    </div>
  );
}
