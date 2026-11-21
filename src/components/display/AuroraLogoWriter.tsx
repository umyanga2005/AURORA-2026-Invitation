import { useEffect, useMemo, useState } from 'react';
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
  const mainChars = useMemo(() => Array.from((logoMain || 'AURORA').trim()), [logoMain]);
  const subChars = useMemo(() => Array.from((logoSub || 'MMXXVI').trim()), [logoSub]);

  const [mainCount, setMainCount] = useState(0);
  const [subCount, setSubCount] = useState(0);
  const [showTopOrnament, setShowTopOrnament] = useState(false);
  const [showBottomOrnament, setShowBottomOrnament] = useState(false);

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
      setMainCount(0);
      setSubCount(0);
      setShowTopOrnament(false);
      setShowBottomOrnament(false);
      return;
    }

    if (phase !== 'WRITING_LOGO') {
      // Ensure everything stays 100% visible in subsequent phases
      setMainCount(mainChars.length);
      setSubCount(subChars.length);
      setShowTopOrnament(true);
      setShowBottomOrnament(true);
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

    // 1. Write main title letter-by-letter ("A U R O R A")
    mainChars.forEach((_, idx) => {
      schedule(() => {
        setMainCount(idx + 1);
        onWriteTick?.();
      }, t);
      t += 310;
    });

    // 2. Draw top lightning bolt & laurel branches
    schedule(() => {
      setShowTopOrnament(true);
      onWriteTick?.();
    }, t + 60);
    t += 480;

    // 3. Write subtitle letter-by-letter ("M M X X V I")
    subChars.forEach((_, idx) => {
      schedule(() => {
        setSubCount(idx + 1);
        onWriteTick?.();
      }, t);
      t += 190;
    });

    // 4. Draw lower laurel cradle
    schedule(() => {
      setShowBottomOrnament(true);
      onWriteTick?.();
    }, t + 80);
    t += 950;

    // 5. Notify completion so lamp glides down & logo glides up
    schedule(() => {
      onLogoWriteComplete?.();
    }, t);

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [phase, mainChars, subChars, onWriteTick, onLogoWriteComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`aurora-logo-stage ${isDockedTop ? 'aurora-logo-docked-top' : 'aurora-logo-center'}`}
      aria-label={`${logoMain} ${logoSub}`}
    >
      <svg
        className="aurora-logo-svg"
        viewBox="0 0 860 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Fire-mixed metallic gold gradient */}
          <linearGradient id="fireGoldFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff7c2" />
            <stop offset="22%" stopColor="#f8cf63" />
            <stop offset="48%" stopColor="#ff9a2e" />
            <stop offset="72%" stopColor="#f5c24c" />
            <stop offset="100%" stopColor="#c77d1c" />
          </linearGradient>

          <linearGradient id="fireGoldStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff8c1a" />
            <stop offset="50%" stopColor="#fff5b8" />
            <stop offset="100%" stopColor="#ff7b00" />
          </linearGradient>

          <filter id="fireGoldGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="3.5" result="blur1" />
            <feGaussianBlur stdDeviation="9" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* TOP ORNAMENTS: Center Lightning Bolt, Upper Laurels & Top Horizontal Accents */}
        <g
          className={`logo-ornament-group ${showTopOrnament ? 'ornament-draw' : ''}`}
          filter="url(#fireGoldGlow)"
        >
          {/* Center Top Lightning Bolt */}
          <path
            className="logo-draw-path"
            d="M446 20 L414 78 L434 78 L420 124 L456 64 L436 64 Z"
            stroke="url(#fireGoldStroke)"
            strokeWidth="2.5"
            fill="url(#fireGoldFill)"
          />

          {/* Left Upper Laurel Stem & Leaves */}
          <path
            className="logo-draw-path"
            d="M322 108 C338 82, 368 58, 404 48"
            stroke="url(#fireGoldStroke)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            className="logo-draw-path"
            d="M336 92 Q325 76 340 66 Q348 80 336 92 Z M354 78 Q346 60 362 54 Q368 68 354 78 Z M375 64 Q370 46 386 44 Q389 58 375 64 Z M352 94 Q366 96 372 82 Q358 80 352 94 Z M374 79 Q388 80 393 66 Q380 65 374 79 Z"
            stroke="url(#fireGoldStroke)"
            strokeWidth="1.6"
            fill="url(#fireGoldFill)"
          />

          {/* Right Upper Laurel Stem & Leaves */}
          <path
            className="logo-draw-path"
            d="M538 108 C522 82, 492 58, 456 48"
            stroke="url(#fireGoldStroke)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            className="logo-draw-path"
            d="M524 92 Q535 76 520 66 Q512 80 524 92 Z M506 78 Q514 60 498 54 Q492 68 506 78 Z M485 64 Q490 46 474 44 Q471 58 485 64 Z M508 94 Q494 96 488 82 Q502 80 508 94 Z M486 79 Q472 80 467 66 Q480 65 486 79 Z"
            stroke="url(#fireGoldStroke)"
            strokeWidth="1.6"
            fill="url(#fireGoldFill)"
          />

          {/* Top Horizontal Rules */}
          <path
            className="logo-draw-path"
            d="M172 104 L306 104 M554 104 L688 104"
            stroke="url(#fireGoldStroke)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Small Side Lightning Accents */}
          <path
            className="logo-draw-path"
            d="M204 122 L192 146 L201 146 L195 166 L211 140 L202 140 Z"
            stroke="url(#fireGoldStroke)"
            strokeWidth="1.4"
            fill="url(#fireGoldFill)"
          />
          <path
            className="logo-draw-path"
            d="M656 122 L644 146 L653 146 L647 166 L663 140 L654 140 Z"
            stroke="url(#fireGoldStroke)"
            strokeWidth="1.4"
            fill="url(#fireGoldFill)"
          />
        </g>

        {/* MAIN TITLE WRITTEN LETTER-BY-LETTER ("AURORA") */}
        <g filter="url(#fireGoldGlow)">
          {mainChars.map((ch, index) => {
            const written = index < mainCount;
            if (!written) return null;
            const total = mainChars.length;
            const span = Math.min(620, total * 102);
            const startX = 430 - span * 0.5 + span / (total * 2);
            const x = startX + (span / total) * index;

            return (
              <g key={`main-${index}-${ch}`} className="logo-letter-write">
                <text
                  x={x}
                  y="214"
                  textAnchor="middle"
                  className="aurora-main-letter"
                  fill="url(#fireGoldFill)"
                  stroke="url(#fireGoldStroke)"
                  strokeWidth="2.2"
                >
                  {ch}
                </text>
              </g>
            );
          })}
        </g>

        {/* SUBTITLE WRITTEN LETTER-BY-LETTER ("MMXXVI") */}
        <g filter="url(#fireGoldGlow)">
          {subChars.map((ch, index) => {
            const written = index < subCount;
            if (!written) return null;
            const total = subChars.length;
            const span = Math.min(340, total * 52);
            const startX = 430 - span * 0.5 + span / (total * 2);
            const x = startX + (span / total) * index;

            return (
              <g key={`sub-${index}-${ch}`} className="logo-letter-write">
                <text
                  x={x}
                  y="294"
                  textAnchor="middle"
                  className="aurora-sub-letter"
                  fill="url(#fireGoldFill)"
                  stroke="url(#fireGoldStroke)"
                  strokeWidth="1.2"
                >
                  {ch}
                </text>
              </g>
            );
          })}
        </g>

        {/* BOTTOM ORNAMENTS: Mid Dividers + Lower Sweeping Cradle & Laurels */}
        <g
          className={`logo-ornament-group ${showBottomOrnament ? 'ornament-draw' : ''}`}
          filter="url(#fireGoldGlow)"
        >
          {/* Mid Horizontal Accents */}
          <path
            className="logo-draw-path"
            d="M238 236 L396 236 M464 236 L622 236"
            stroke="url(#fireGoldStroke)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Lower Sweeping Golden Cradle */}
          <path
            className="logo-draw-path"
            d="M118 228 C158 262, 206 312, 272 316 L392 316 C414 316, 424 326, 430 340 C436 326, 446 316, 468 316 L588 316 C654 312, 702 262, 742 228"
            stroke="url(#fireGoldStroke)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Left Lower Laurel Leaves */}
          <path
            className="logo-draw-path"
            d="M142 246 Q128 236 138 224 Q152 232 142 246 Z M168 268 Q154 256 164 244 Q178 254 168 268 Z M198 288 Q186 274 198 264 Q210 274 198 288 Z M230 304 Q220 290 234 282 Q244 294 230 304 Z"
            stroke="url(#fireGoldStroke)"
            strokeWidth="1.5"
            fill="url(#fireGoldFill)"
          />

          {/* Right Lower Laurel Leaves */}
          <path
            className="logo-draw-path"
            d="M718 246 Q732 236 722 224 Q708 232 718 246 Z M692 268 Q706 256 696 244 Q682 254 692 268 Z M662 288 Q674 274 662 264 Q650 274 662 288 Z M630 304 Q640 290 626 282 Q616 294 630 304 Z"
            stroke="url(#fireGoldStroke)"
            strokeWidth="1.5"
            fill="url(#fireGoldFill)"
          />

          {/* Bottom Center Flourish */}
          <path
            className="logo-draw-path"
            d="M430 344 L424 330 L430 322 L436 330 Z"
            stroke="url(#fireGoldStroke)"
            strokeWidth="1.4"
            fill="url(#fireGoldFill)"
          />
        </g>
      </svg>
    </div>
  );
}
