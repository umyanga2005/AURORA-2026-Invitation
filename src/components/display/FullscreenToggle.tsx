import { useCallback, useEffect, useState } from 'react';

interface WebkitDocument extends Document {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

interface WebkitHTMLElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as WebkitDocument;
  const el = document.documentElement as WebkitHTMLElement;
  return Boolean(
    (doc.fullscreenEnabled || doc.webkitFullscreenEnabled) &&
      (typeof el.requestFullscreen === 'function' ||
        typeof el.webkitRequestFullscreen === 'function')
  );
}

function getFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const doc = document as WebkitDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export function FullscreenToggle() {
  const [supported] = useState<boolean>(() => isFullscreenSupported());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => Boolean(getFullscreenElement()));

  useEffect(() => {
    if (!supported) return;
    const handleChange = () => {
      setIsFullscreen(Boolean(getFullscreenElement()));
    };
    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
    };
  }, [supported]);

  const handleToggle = useCallback(async () => {
    try {
      const doc = document as WebkitDocument;
      const el = document.documentElement as WebkitHTMLElement;
      if (!getFullscreenElement()) {
        if (typeof el.requestFullscreen === 'function') {
          await el.requestFullscreen();
        } else if (typeof el.webkitRequestFullscreen === 'function') {
          await el.webkitRequestFullscreen();
        }
      } else {
        if (typeof doc.exitFullscreen === 'function') {
          await doc.exitFullscreen();
        } else if (typeof doc.webkitExitFullscreen === 'function') {
          await doc.webkitExitFullscreen();
        }
      }
    } catch {
      // Gracefully ignore browser gesture or policy rejections
    }
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      className="fullscreen-toggle-btn"
      onClick={handleToggle}
      aria-label={isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode'}
      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Presentation'}
    >
      {isFullscreen ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="4 14 10 14 10 20" />
          <polyline points="20 10 14 10 14 4" />
          <line x1="14" y1="10" x2="21" y2="3" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      )}
    </button>
  );
}
