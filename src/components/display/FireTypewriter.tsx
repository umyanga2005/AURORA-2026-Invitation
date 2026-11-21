import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
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
  content: string;
}

export function FireTypewriter({
  text,
  phase,
  onTypeTick,
  onComplete,
}: FireTypewriterProps) {
  const reducedMotion = useReducedMotion();

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
        content: `${text.dateLabel.trim() || 'Date'} — ${text.dateValue.trim()}`,
      });
    }
    if (text.timeValue.trim()) {
      items.push({
        id: 'time',
        kind: 'detail',
        content: `${text.timeLabel.trim() || 'Time'} — ${text.timeValue.trim()}`,
      });
    }
    if (text.venueValue.trim()) {
      items.push({
        id: 'venue',
        kind: 'detail',
        content: `${text.venueLabel.trim() || 'Venue'} — ${text.venueValue.trim()}`,
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

    if (reducedMotion || phase === 'COMPLETE') {
      setTypedChars(totalChars);
      if (reducedMotion && phase === 'TYPING_INVITATION') {
        onComplete?.();
      }
      return;
    }

    if (totalChars === 0) {
      onComplete?.();
      return;
    }

    let cancelled = false;
    let current = 0;
    const speed = Math.max(15, Math.min(140, text.typingSpeedMs || 42));

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

      const pause = flatBreaks.has(current) ? speed * 6.0 : ch === ' ' ? speed * 0.6 : speed;
      timerId = window.setTimeout(step, pause);
    };

    timerId = window.setTimeout(step, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [isVisible, phase, reducedMotion, lines, totalChars, text.typingSpeedMs, onTypeTick, onComplete]);

  if (!isVisible) return null;

  let remaining = typedChars;
  const isTypingActive = !reducedMotion && phase === 'TYPING_INVITATION' && typedChars < totalChars;

  // Render word-grouped characters so lines never wrap mid-word on mobile screens
  const renderLine = (line: TypedLineItem, visibleCount: number, isCurrentActiveLine: boolean) => {
    const visibleText = line.content.slice(0, visibleCount);
    const tokens = visibleText.split(/(\s+)/);
    let charOffset = 0;

    return (
      <div key={line.id} className={`inv-line inv-line-${line.kind}`}>
        {tokens.map((token, tIdx) => {
          const tokenStart = charOffset;
          charOffset += token.length;
          if (!token) return null;

          if (/^\s+$/.test(token)) {
            return (
              <span key={`${line.id}-sp-${tIdx}`} className="gold-space">
                {' '}
              </span>
            );
          }

          return (
            <span key={`${line.id}-w-${tIdx}`} className="gold-word">
              {Array.from(token).map((char, cIdx) => (
                <span key={`${line.id}-${tokenStart + cIdx}`} className="gold-char">
                  {char}
                </span>
              ))}
            </span>
          );
        })}
        {isCurrentActiveLine && (
          <span className="gold-cursor" aria-hidden="true">
            ✦
          </span>
        )}
      </div>
    );
  };

  // Pre-compute visible counts cleanly in order
  const renderedBlocks: Array<{ line: TypedLineItem; lineIdx: number; visibleCount: number; active: boolean }> = [];
  lines.forEach((line, lineIdx) => {
    const lineLen = line.content.length;
    const visibleCount = Math.max(0, Math.min(lineLen, remaining));
    remaining -= lineLen;
    if (visibleCount > 0) {
      const isCurrentActiveLine =
        isTypingActive &&
        (visibleCount < lineLen || remaining <= 0) &&
        (lineIdx === lines.length - 1 || remaining <= 0);
      renderedBlocks.push({ line, lineIdx, visibleCount, active: isCurrentActiveLine });
    }
  });

  const introBlocks = renderedBlocks.filter((b) => b.line.kind === 'eyebrow' || b.line.kind === 'subtitle' || b.line.kind === 'title');
  const detailBlocks = renderedBlocks.filter((b) => b.line.kind === 'detail');
  const footerBlocks = renderedBlocks.filter((b) => b.line.kind === 'footer');

  return (
    <section className="invitation-text-layer" aria-live="polite" aria-label="Event Invitation Details">
      {/* Decorative Greek Gold Separator */}
      <div className="gold-ornamental-divider" aria-hidden="true">
        <span className="divider-line" />
        <span className="divider-diamond" />
        <span className="divider-line" />
      </div>

      {/* Organization, Introduction & Main Event Title */}
      <div className="inv-header-group">
        {introBlocks.map((b) => renderLine(b.line, b.visibleCount, b.active))}
      </div>

      {/* Date, Time & Venue */}
      {detailBlocks.length > 0 && (
        <div className="inv-details-group">
          {detailBlocks.map((b) => renderLine(b.line, b.visibleCount, b.active))}
        </div>
      )}

      {/* Closing Quotation */}
      {footerBlocks.length > 0 && (
        <div className="inv-footer-group">
          {footerBlocks.map((b) => renderLine(b.line, b.visibleCount, b.active))}
        </div>
      )}
    </section>
  );
}
