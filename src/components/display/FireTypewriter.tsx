import { useEffect, useMemo, useState } from 'react';
import type { InvitationPhase, InvitationTextConfig } from '../../types/invitation';

interface FireTypewriterProps {
  text: InvitationTextConfig;
  phase: InvitationPhase;
  onTypeTick?: () => void;
  onComplete?: () => void;
}

interface TypedLineItem {
  id: string;
  kind: 'eyebrow' | 'subtitle' | 'title' | 'detail' | 'footer';
  label?: string;
  content: string;
}

export function FireTypewriter({
  text,
  phase,
  onTypeTick,
  onComplete,
}: FireTypewriterProps) {
  const lines = useMemo<TypedLineItem[]>(() => {
    const items: TypedLineItem[] = [];
    if (text.headerLine1.trim()) {
      items.push({ id: 'h1', kind: 'eyebrow', content: text.headerLine1.trim() });
    }
    if (text.headerLine2.trim()) {
      items.push({ id: 'h2', kind: 'subtitle', content: text.headerLine2.trim() });
    }
    if (text.eventTitle.trim()) {
      items.push({ id: 'title', kind: 'title', content: text.eventTitle.trim() });
    }
    if (text.dateValue.trim()) {
      items.push({
        id: 'date',
        kind: 'detail',
        label: text.dateLabel.trim() || 'Date',
        content: `${text.dateLabel.trim() || 'Date'}  —  ${text.dateValue.trim()}`,
      });
    }
    if (text.timeValue.trim()) {
      items.push({
        id: 'time',
        kind: 'detail',
        label: text.timeLabel.trim() || 'Time',
        content: `${text.timeLabel.trim() || 'Time'}  —  ${text.timeValue.trim()}`,
      });
    }
    if (text.venueValue.trim()) {
      items.push({
        id: 'venue',
        kind: 'detail',
        label: text.venueLabel.trim() || 'Venue',
        content: `${text.venueLabel.trim() || 'Venue'}  —  ${text.venueValue.trim()}`,
      });
    }
    if (text.footerLine.trim()) {
      items.push({ id: 'footer', kind: 'footer', content: text.footerLine.trim() });
    }
    return items;
  }, [text]);

  const totalChars = useMemo(
    () => lines.reduce((acc, item) => acc + item.content.length, 0),
    [lines]
  );

  const [typedChars, setTypedChars] = useState(0);

  const isVisible = phase === 'TYPING_INVITATION' || phase === 'COMPLETE';

  useEffect(() => {
    if (!isVisible) {
      setTypedChars(0);
      return;
    }

    if (phase === 'COMPLETE') {
      setTypedChars(totalChars);
      return;
    }

    if (totalChars === 0) {
      onComplete?.();
      return;
    }

    let cancelled = false;
    let current = 0;
    const speed = Math.max(15, Math.min(140, text.typingSpeedMs || 42));

    // Precompute flat character string to check spaces / line breaks for natural rhythm
    const flatBreaks = new Set<number>();
    let offset = 0;
    for (const line of lines) {
      offset += line.content.length;
      flatBreaks.add(offset);
    }

    let timerId = 0;
    const step = () => {
      if (cancelled) return;
      current += 1;
      setTypedChars(current);

      // Determine current character
      let idx = current - 1;
      let ch = '';
      for (const line of lines) {
        if (idx < line.content.length) {
          ch = line.content[idx];
          break;
        }
        idx -= line.content.length;
      }

      if (ch && ch !== ' ') {
        onTypeTick?.();
      }

      if (current >= totalChars) {
        onComplete?.();
        return;
      }

      const pause = flatBreaks.has(current) ? speed * 6.5 : ch === ' ' ? speed * 0.65 : speed;
      timerId = window.setTimeout(step, pause);
    };

    timerId = window.setTimeout(step, 240);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [isVisible, phase, lines, totalChars, text.typingSpeedMs, onTypeTick, onComplete]);

  if (!isVisible) return null;

  // Split typedChars across lines
  let remaining = typedChars;
  const isTypingActive = phase === 'TYPING_INVITATION' && typedChars < totalChars;

  return (
    <div className="invitation-text-layer" aria-live="polite">
      {lines.map((line, lineIdx) => {
        const lineLen = line.content.length;
        const visibleCount = Math.max(0, Math.min(lineLen, remaining));
        remaining -= lineLen;

        if (visibleCount === 0) return null;

        const isCurrentActiveLine =
          isTypingActive &&
          visibleCount > 0 &&
          (visibleCount < lineLen || remaining <= 0) &&
          (lineIdx === lines.length - 1 || remaining <= 0);

        const visibleChars = Array.from(line.content.slice(0, visibleCount));

        return (
          <div key={line.id} className={`inv-line inv-line-${line.kind}`}>
            {visibleChars.map((char, cIdx) => (
              <span
                key={`${line.id}-${cIdx}`}
                className="fire-char"
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
            {isCurrentActiveLine && <span className="fire-cursor" aria-hidden="true">✦</span>}
          </div>
        );
      })}
    </div>
  );
}
