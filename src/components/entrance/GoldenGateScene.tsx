import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { EntranceState } from '../../types/entrance';
import { GateDoor } from './GateDoor';
import { GateEmblem } from './GateEmblem';
import { GoldenLightReveal } from './GoldenLightReveal';

interface GoldenGateSceneProps {
  entranceState: EntranceState;
}

const GATE_Z = 1.65;
const DOOR_OPEN_ANGLE = Math.PI * 0.62; // ~111.6 deg outward swing

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function GoldenGateScene({ entranceState }: GoldenGateSceneProps) {
  const { camera, size } = useThree();
  const reducedMotion = useReducedMotion();

  const leftPivotRef = useRef<THREE.Group>(null);
  const rightPivotRef = useRef<THREE.Group>(null);
  const backdropMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Smooth animation values updated per-frame without React re-renders
  const openProgressRef = useRef(0);
  const awakenRef = useRef(0);
  const [visualState, setVisualState] = useState({
    emblemGlow: 0,
    emblemOpacity: 0,
    emblemScale: 0.94,
    seamIntensity: 0,
    revealIntensity: 0,
    doorOpacity: 1,
    emissiveBoost: 0,
    openProgress: 0,
  });

  // Compute exact visible plane dimensions at z = GATE_Z across all orientations
  const framing = useMemo(() => {
    const persp = camera as THREE.PerspectiveCamera;
    const fovRad = THREE.MathUtils.degToRad(persp.fov || 45);
    const dist = Math.max(1, persp.position.z - GATE_Z);
    const visH = 2 * Math.tan(fovRad * 0.5) * dist;
    const aspect = size.width / Math.max(size.height, 1);
    const visW = visH * aspect;

    const isPortrait = aspect < 0.95;
    const isTabletPortrait = isPortrait && aspect > 0.56;
    const isMobileLandscape = !isPortrait && size.height <= 500;

    // Responsive temple gate proportions tailored per device orientation
    let gateHeight: number;
    let gateWidth: number;
    let centerY: number;

    if (isTabletPortrait) {
      // Tablet Portrait: monumental doors occupy ~72% height, leaving clean space below for prompt
      gateHeight = visH * 0.72;
      gateWidth = Math.min(visW * 0.84, gateHeight * 0.68);
      centerY = visH * 0.04;
    } else if (isPortrait) {
      // Mobile Portrait
      gateHeight = visH * 0.68;
      gateWidth = Math.min(visW * 0.88, gateHeight * 0.68);
      centerY = visH * 0.05;
    } else if (isMobileLandscape) {
      // Short Mobile Landscape
      gateHeight = visH * 0.78;
      gateWidth = Math.min(visW * 0.52, gateHeight * 0.92);
      centerY = visH * 0.04;
    } else {
      // Desktop & Tablet Landscape
      gateHeight = visH * 0.82;
      gateWidth = Math.min(visW * 0.62, gateHeight * 0.82);
      centerY = visH * 0.02;
    }

    const doorWidth = gateWidth * 0.5;
    const doorDepth = Math.max(0.08, doorWidth * 0.075);
    const emblemRadius = Math.min(doorWidth * 0.58, gateHeight * 0.165);
    const frameThick = Math.max(0.06, gateWidth * 0.036);

    return {
      visW,
      visH,
      gateWidth,
      gateHeight,
      doorWidth,
      doorDepth,
      emblemRadius,
      frameThick,
      centerY,
    };
  }, [camera, size.width, size.height]);

  useFrame((_, rawDelta) => {
    if (entranceState === 'INVITATION_VISIBLE') return;
    const dt = Math.min(rawDelta, 0.05);

    // Awaken fade-in
    const targetAwaken = entranceState === 'INITIALIZING' ? 0.55 : 1.0;
    awakenRef.current = THREE.MathUtils.lerp(awakenRef.current, targetAwaken, 1 - Math.exp(-2.8 * dt));

    // Door opening progress (0 -> 1 over ~2.9s, or ~0.9s for reduced motion)
    if (entranceState === 'DOORS_OPENING' || entranceState === 'LIGHT_REVEAL') {
      const duration = reducedMotion ? 0.95 : 2.9;
      openProgressRef.current = Math.min(1, openProgressRef.current + dt / duration);
    } else if (entranceState === 'INITIALIZING' || entranceState === 'ENTRANCE_READY') {
      openProgressRef.current = 0;
    }

    const easedOpen = easeInOutCubic(openProgressRef.current);

    // Rotate left & right doors smoothly outward from their outer hinges
    if (leftPivotRef.current) {
      leftPivotRef.current.rotation.y = -easedOpen * DOOR_OPEN_ANGLE;
    }
    if (rightPivotRef.current) {
      rightPivotRef.current.rotation.y = easedOpen * DOOR_OPEN_ANGLE;
    }

    // Concealment backdrop behind the closed doors fades smoothly as doors part
    if (backdropMatRef.current) {
      const concealOpacity =
        entranceState === 'LIGHT_REVEAL'
          ? Math.max(0, 1 - (openProgressRef.current - 0.15) * 1.45)
          : entranceState === 'DOORS_OPENING'
          ? Math.max(0, 1 - easedOpen * 1.35)
          : 1;
      backdropMatRef.current.opacity = concealOpacity;
    }

    // Compute smooth shader & emblem transitions
    const isEntering = entranceState === 'ENTERING';
    const isOpening = entranceState === 'DOORS_OPENING';
    const isReveal = entranceState === 'LIGHT_REVEAL';

    const nextEmblemGlow = isEntering ? 1.0 : isOpening ? Math.max(0, 1 - easedOpen * 2.2) : 0.25 * awakenRef.current;
    const nextEmblemOpacity = isOpening || isReveal
      ? Math.max(0, 1 - easedOpen * 3.2)
      : awakenRef.current;
    const nextEmblemScale = isEntering ? 1.03 : 0.96 + 0.04 * awakenRef.current;

    const nextSeamIntensity = isEntering
      ? 0.95
      : isOpening
      ? Math.max(0, 1.1 - easedOpen * 0.7)
      : isReveal
      ? Math.max(0, 0.45 * (1 - openProgressRef.current))
      : 0.18 * awakenRef.current;

    const nextRevealIntensity = isOpening
      ? easedOpen * 0.95
      : isReveal
      ? Math.max(0, 0.95 * (1 - Math.max(0, (openProgressRef.current - 0.55) / 0.45)))
      : 0;

    const nextDoorOpacity = isReveal
      ? Math.max(0, 1 - Math.max(0, (openProgressRef.current - 0.62) / 0.38))
      : 1;

    setVisualState((prev) => {
      if (
        Math.abs(prev.emblemGlow - nextEmblemGlow) < 0.008 &&
        Math.abs(prev.emblemOpacity - nextEmblemOpacity) < 0.008 &&
        Math.abs(prev.seamIntensity - nextSeamIntensity) < 0.008 &&
        Math.abs(prev.revealIntensity - nextRevealIntensity) < 0.008 &&
        Math.abs(prev.doorOpacity - nextDoorOpacity) < 0.008 &&
        Math.abs(prev.openProgress - easedOpen) < 0.008
      ) {
        return prev;
      }
      return {
        emblemGlow: nextEmblemGlow,
        emblemOpacity: nextEmblemOpacity,
        emblemScale: nextEmblemScale,
        seamIntensity: nextSeamIntensity,
        revealIntensity: nextRevealIntensity,
        doorOpacity: nextDoorOpacity,
        emissiveBoost: nextEmblemGlow,
        openProgress: easedOpen,
      };
    });
  });

  if (entranceState === 'INVITATION_VISIBLE') return null;

  const {
    visW,
    visH,
    gateWidth,
    gateHeight,
    doorWidth,
    doorDepth,
    emblemRadius,
    frameThick,
    centerY,
  } = framing;

  return (
    <group position={[0, 0, GATE_Z]}>
      {/* Controlled Cinematic Golden Temple Lighting */}
      <ambientLight intensity={0.42} color="#F4D58A" />
      <directionalLight position={[2.4, 3.2, 4.5]} intensity={2.1} color="#FFF2C6" />
      <directionalLight position={[-2.6, 1.4, 3.2]} intensity={0.95} color="#D6A64B" />
      <pointLight
        position={[0, centerY, 0.9]}
        intensity={0.7 + visualState.emblemGlow * 1.4}
        distance={7}
        color="#F4D58A"
      />

      {/* Opaque Obsidian Backdrop concealing the Lamp until Doors Open */}
      <mesh position={[0, 0, -0.24]} renderOrder={20}>
        <planeGeometry args={[visW * 1.25, visH * 1.25]} />
        <meshBasicMaterial
          ref={backdropMatRef}
          color="#050505"
          transparent
          opacity={1}
          depthWrite={false}
        />
      </mesh>

      {/* Main Centered Monumental Gate Assembly */}
      <group position={[0, centerY, 0]}>
        {/* Divine Golden Light Emerging from Behind the Central Seam */}
        <GoldenLightReveal
          width={gateWidth * 1.65}
          height={gateHeight * 1.35}
          seamIntensity={visualState.seamIntensity}
          revealIntensity={visualState.revealIntensity}
          openProgress={visualState.openProgress}
        />

        {/* Monumental Outer Temple Archway Frame (Left Pillar, Right Pillar, Top Lintel) */}
        <group>
          {/* Top Temple Lintel */}
          <mesh position={[0, gateHeight * 0.5 + frameThick * 0.55, -0.02]} renderOrder={21}>
            <boxGeometry args={[gateWidth + frameThick * 2.5, frameThick * 1.25, doorDepth * 1.55]} />
            <meshStandardMaterial
              color="#A8792A"
              metalness={0.82}
              roughness={0.3}
              transparent={visualState.doorOpacity < 0.999}
              opacity={visualState.doorOpacity}
            />
          </mesh>
          {/* Left Pillar */}
          <mesh position={[-gateWidth * 0.5 - frameThick * 0.55, 0, -0.02]} renderOrder={21}>
            <boxGeometry args={[frameThick * 1.15, gateHeight + frameThick * 0.4, doorDepth * 1.45]} />
            <meshStandardMaterial
              color="#7a5720"
              metalness={0.78}
              roughness={0.36}
              transparent={visualState.doorOpacity < 0.999}
              opacity={visualState.doorOpacity}
            />
          </mesh>
          {/* Right Pillar */}
          <mesh position={[gateWidth * 0.5 + frameThick * 0.55, 0, -0.02]} renderOrder={21}>
            <boxGeometry args={[frameThick * 1.15, gateHeight + frameThick * 0.4, doorDepth * 1.45]} />
            <meshStandardMaterial
              color="#7a5720"
              metalness={0.78}
              roughness={0.36}
              transparent={visualState.doorOpacity < 0.999}
              opacity={visualState.doorOpacity}
            />
          </mesh>
        </group>

        {/* Left & Right Monumental Doors (True Outer-Edge Hinge Pivots) */}
        <GateDoor
          side="left"
          doorWidth={doorWidth}
          doorHeight={gateHeight}
          doorDepth={doorDepth}
          pivotRef={leftPivotRef}
          emissiveBoost={visualState.emissiveBoost}
          opacity={visualState.doorOpacity}
        />
        <GateDoor
          side="right"
          doorWidth={doorWidth}
          doorHeight={gateHeight}
          doorDepth={doorDepth}
          pivotRef={rightPivotRef}
          emissiveBoost={visualState.emissiveBoost}
          opacity={visualState.doorOpacity}
        />

        {/* Central Circular AURORA 2026 Medallion */}
        <GateEmblem
          radius={emblemRadius}
          zOffset={doorDepth * 0.62}
          glowIntensity={visualState.emblemGlow}
          opacity={visualState.emblemOpacity}
          scale={visualState.emblemScale}
        />
      </group>
    </group>
  );
}
