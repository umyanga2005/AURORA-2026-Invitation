import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { InvitationPhase } from '../../types/invitation';

interface AuroraLogoWriterProps {
  logoMain: string;
  logoSub: string;
  phase: InvitationPhase;
  onWriteTick?: () => void;
  onLogoWriteComplete?: () => void;
}

export function AuroraLogoWriter({
  logoMain,
  logoSub,
  phase,
  onWriteTick,
  onLogoWriteComplete,
}: AuroraLogoWriterProps) {
  const reducedMotion = useReducedMotion();
  const normalizedMain = (logoMain || 'AURORA').trim();
  const normalizedSub = (logoSub || 'MMXXVI').trim();

  const mainChars = useMemo(() => Array.from(normalizedMain), [normalizedMain]);
  const subChars = useMemo(() => Array.from(normalizedSub), [normalizedSub]);

  // Use the polished 3D metallic gold artwork in Stage 4/5 when displaying the default AURORA MMXXVI emblem
  const canUseMetallicArtwork =
    normalizedMain.toUpperCase() === 'AURORA' && normalizedSub.toUpperCase() === 'MMXXVI';

  const [showTopOrnament, setShowTopOrnament] = useState(false);
  const [mainCount, setMainCount] = useState(0);
  const [subCount, setSubCount] = useState(0);
  const [showBottomOrnament, setShowBottomOrnament] = useState(false);
  const [artworkRevealed, setArtworkRevealed] = useState(false);
  const [artworkLoaded, setArtworkLoaded] = useState(false);

  const isVisible =
    phase === 'WRITING_LOGO' ||
    phase === 'TRANSITIONING' ||
    phase === 'TYPING_INVITATION' ||
    phase === 'COMPLETE';

  const isDockedTop =
    phase === 'TRANSITIONING' ||
    phase === 'TYPING_INVITATION' ||
    phase === 'COMPLETE';

  useEffect(() => {
    if (phase === 'EXTINGUISHED' || phase === 'IGNITING') {
      setShowTopOrnament(false);
      setMainCount(0);
      setSubCount(0);
      setShowBottomOrnament(false);
      setArtworkRevealed(false);
      return;
    }

    if (reducedMotion || phase !== 'WRITING_LOGO') {
      setShowTopOrnament(true);
      setMainCount(mainChars.length);
      setSubCount(subChars.length);
      setShowBottomOrnament(true);
      if (canUseMetallicArtwork) {
        setArtworkRevealed(true);
      }
      if (reducedMotion && phase === 'WRITING_LOGO') {
        const quickId = window.setTimeout(() => {
          onLogoWriteComplete?.();
        }, 120);
        return () => window.clearTimeout(quickId);
      }
      return;
    }

    let cancelled = false;
    const timers: number[] = [];

    const schedule = (fn: () => void, delay: number) => {
      const id = window.setTimeout(() => {
        if (!cancelled) fn();
      }, delay);
      timers.push(id);
    };

    let t = 120;

    // STAGE 2 — Lightning symbol & upper laurel decorations appear first in restrained gold
    schedule(() => {
      setShowTopOrnament(true);
      onWriteTick?.();
    }, t);
    t += 520;

    // STAGE 3 — SVG letter writing for AURORA
    mainChars.forEach((_, idx) => {
      schedule(() => {
        setMainCount(idx + 1);
        onWriteTick?.();
      }, t);
      t += 260;
    });

    // Write subtitle MMXXVI
    t += 120;
    subChars.forEach((_, idx) => {
      schedule(() => {
        setSubCount(idx + 1);
        onWriteTick?.();
      }, t);
      t += 160;
    });

    // Draw lower laurel cradle
    schedule(() => {
      setShowBottomOrnament(true);
      onWriteTick?.();
    }, t + 60);
    t += 780;

    // STAGE 4 — Smooth transformation into polished 3D metallic gold artwork
    if (canUseMetallicArtwork) {
      schedule(() => {
        setArtworkRevealed(true);
      }, t);
      t += 920;
    } else {
      t += 300;
    }

    // STAGE 5 — Complete & proceed to docked header layout
    schedule(() => {
      onLogoWriteComplete?.();
    }, t);

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [
    phase,
    reducedMotion,
    mainChars,
    subChars,
    canUseMetallicArtwork,
    onWriteTick,
    onLogoWriteComplete,
  ]);

  if (!isVisible) return null;

  const showFinalPng = canUseMetallicArtwork && artworkRevealed && artworkLoaded;

  return (
    <div
      className={`aurora-logo-stage ${isDockedTop ? 'aurora-logo-docked' : 'aurora-logo-writing'}`}
      aria-label={`${normalizedMain} ${normalizedSub}`}
    >
      <div className="aurora-logo-frame">
        {/* SVG Writing Layer — cleanly fades out as 3D metallic artwork resolves (no duplicate lettering) */}
        <svg
          className={`aurora-logo-svg ${showFinalPng ? 'aurora-svg-resolved' : ''}`}
          viewBox="0 0 1024 558"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden={showFinalPng}
        >
          <defs>
            {/* Clean Metallic Champagne-Antique Gold Fill (no fire/orange) */}
            <linearGradient id="royalGoldFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF2C6" />
              <stop offset="28%" stopColor="#F4D58A" />
              <stop offset="58%" stopColor="#D6A64B" />
              <stop offset="86%" stopColor="#A8792A" />
              <stop offset="100%" stopColor="#D6A64B" />
            </linearGradient>

            {/* Fine Metallic Gold Writing Stroke */}
            <linearGradient id="royalGoldStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A8792A" />
              <stop offset="35%" stopColor="#F4D58A" />
              <stop offset="50%" stopColor="#FFF2C6" />
              <stop offset="65%" stopColor="#D6A64B" />
              <stop offset="100%" stopColor="#A8792A" />
            </linearGradient>

            {/* Restrained subtle warm gold aura */}
            <filter id="royalGoldAura" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="3.5"
                floodColor="#D6A64B"
                floodOpacity="0.28"
              />
            </filter>
          </defs>

          {/* STAGE 2: TOP LIGHTNING BOLT, UPPER LAURELS & ACCENT RULES */}
          <g
            className={`logo-ornament-group ${showTopOrnament ? 'ornament-draw' : ''}`}
            filter="url(#royalGoldAura)"
          >
            {/* Center Top Lightning Symbol */}
            <path
              className="logo-draw-path"
              d="M526 70 L492 138 L514 138 L498 188 L540 120 L518 120 Z"
              stroke="url(#royalGoldStroke)"
              strokeWidth="2.4"
              fill="url(#royalGoldFill)"
            />

            {/* Left Upper Laurel Branch */}
            <path
              className="logo-draw-path"
              d="M380 176 C400 144, 434 118, 476 106"
              stroke="url(#royalGoldStroke)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              className="logo-draw-path"
              d="M396 156 Q384 138 400 126 Q410 142 396 156 Z M418 140 Q408 120 426 112 Q434 128 418 140 Z M442 124 Q436 104 454 102 Q458 118 442 124 Z M414 158 Q430 160 438 144 Q422 142 414 158 Z M440 141 Q456 142 462 126 Q448 125 440 141 Z"
              stroke="url(#royalGoldStroke)"
              strokeWidth="1.5"
              fill="url(#royalGoldFill)"
            />

            {/* Right Upper Laurel Branch */}
            <path
              className="logo-draw-path"
              d="M644 176 C624 144, 590 118, 548 106"
              stroke="url(#royalGoldStroke)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              className="logo-draw-path"
              d="M628 156 Q640 138 624 126 Q614 142 628 156 Z M606 140 Q616 120 598 112 Q590 128 606 140 Z M582 124 Q588 104 570 102 Q566 118 582 124 Z M610 158 Q594 160 586 144 Q602 142 610 158 Z M584 141 Q568 142 562 126 Q576 125 584 141 Z"
              stroke="url(#royalGoldStroke)"
              strokeWidth="1.5"
              fill="url(#royalGoldFill)"
            />

            {/* Top Horizontal Accent Lines */}
            <path
              className="logo-draw-path"
              d="M214 162 L362 162 M662 162 L810 162"
              stroke="url(#royalGoldStroke)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            {/* Flanking Small Lightning Bolts */}
            <path
              className="logo-draw-path"
              d="M250 182 L236 212 L247 212 L240 236 L259 204 L248 204 Z"
              stroke="url(#royalGoldStroke)"
              strokeWidth="1.4"
              fill="url(#royalGoldFill)"
            />
            <path
              className="logo-draw-path"
              d="M774 182 L760 212 L771 212 L764 236 L783 204 L772 204 Z"
              stroke="url(#royalGoldStroke)"
              strokeWidth="1.4"
              fill="url(#royalGoldFill)"
            />
          </g>

          {/* STAGE 3: MAIN TITLE WRITTEN LETTER-BY-LETTER ("AURORA") */}
          <g filter="url(#royalGoldAura)">
            {mainChars.map((ch, index) => {
              if (index >= mainCount) return null;
              const total = mainChars.length;
              const span = Math.min(730, total * 122);
              const startX = 512 - span * 0.5 + span / (total * 2);
              const x = startX + (span / total) * index;

              return (
                <text
                  key={`main-${index}-${ch}`}
                  x={x}
                  y="314"
                  textAnchor="middle"
                  className="aurora-main-letter"
                  fill="url(#royalGoldFill)"
                  stroke="url(#royalGoldStroke)"
                  strokeWidth="2"
                >
                  {ch}
                </text>
              );
            })}
          </g>

          {/* SUBTITLE WRITTEN LETTER-BY-LETTER ("MMXXVI") */}
          <g filter="url(#royalGoldAura)">
            {subChars.map((ch, index) => {
              if (index >= subCount) return null;
              const total = subChars.length;
              const span = Math.min(410, total * 64);
              const startX = 512 - span * 0.5 + span / (total * 2);
              const x = startX + (span / total) * index;

              return (
                <text
                  key={`sub-${index}-${ch}`}
                  x={x}
                  y="424"
                  textAnchor="middle"
                  className="aurora-sub-letter"
                  fill="url(#royalGoldFill)"
                  stroke="url(#royalGoldStroke)"
                  strokeWidth="1.15"
                >
                  {ch}
                </text>
              );
            })}
          </g>

          {/* LOWER SWEEPING CRADLE & LAUREL WREATHS */}
          <g
            className={`logo-ornament-group ${showBottomOrnament ? 'ornament-draw' : ''}`}
            filter="url(#royalGoldAura)"
          >
            {/* Mid Horizontal Accents */}
            <path
              className="logo-draw-path"
              d="M294 342 L472 342 M552 342 L730 342"
              stroke="url(#royalGoldStroke)"
              strokeWidth="2.1"
              strokeLinecap="round"
            />

            {/* Lower Sweeping Golden Cradle */}
            <path
              className="logo-draw-path"
              d="M150 338 C198 380, 254 446, 332 452 L468 452 C494 452, 505 466, 512 486 C519 466, 530 452, 556 452 L692 452 C770 446, 826 380, 874 338"
              stroke="url(#royalGoldStroke)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            {/* Left Lower Laurels */}
            <path
              className="logo-draw-path"
              d="M180 362 Q164 350 176 334 Q192 344 180 362 Z M212 390 Q196 376 208 360 Q224 372 212 390 Z M248 416 Q234 400 248 386 Q262 400 248 416 Z M286 436 Q274 420 290 410 Q302 424 286 436 Z"
              stroke="url(#royalGoldStroke)"
              strokeWidth="1.4"
              fill="url(#royalGoldFill)"
            />

            {/* Right Lower Laurels */}
            <path
              className="logo-draw-path"
              d="M844 362 Q860 350 848 334 Q832 344 844 362 Z M812 390 Q828 376 816 360 Q800 372 812 390 Z M776 416 Q790 400 776 386 Q762 400 776 416 Z M738 436 Q750 420 734 410 Q722 424 738 436 Z"
              stroke="url(#royalGoldStroke)"
              strokeWidth="1.4"
              fill="url(#royalGoldFill)"
            />

            {/* Bottom Center Flourish */}
            <path
              className="logo-draw-path"
              d="M512 492 L505 474 L512 462 L519 474 Z"
              stroke="url(#royalGoldStroke)"
              strokeWidth="1.4"
              fill="url(#royalGoldFill)"
            />
          </g>
        </svg>

        {/* STAGE 4 & 5: Polished 3D Metallic Gold Artwork (preloaded seamlessly in same 1024x558 frame) */}
        {canUseMetallicArtwork && (
          <img
            src="/aurora-logo.png"
            alt="AURORA MMXXVI"
            className={`aurora-metallic-artwork ${showFinalPng ? 'aurora-artwork-visible' : ''}`}
            onLoad={() => setArtworkLoaded(true)}
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}
