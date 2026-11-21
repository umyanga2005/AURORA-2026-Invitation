import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import sparkVertexShader from '../../shaders/sparkVertex.glsl?raw';
import sparkFragmentShader from '../../shaders/sparkFragment.glsl?raw';
import type { FlameColorPalette } from '../../config/flameColors';
import type { ProgressiveIgnitionController } from '../../engine/IgnitionController';

interface SparkRendererProps {
  controller: ProgressiveIgnitionController;
}

const MAX_RENDERED_SPARKS = 32;
const TRAIL_SEGMENTS = 10;

export function SparkRenderer({ controller }: SparkRendererProps) {
  const headRefs = useRef<(THREE.Mesh | null)[]>([]);
  const trailRefs = useRef<(THREE.Mesh | null)[][]>(
    Array.from({ length: MAX_RENDERED_SPARKS }, () => [])
  );
  const lastPaletteRef = useRef<FlameColorPalette | null>(null);

  const headMaterials = useMemo(() => {
    const pal = controller.flame.getColorPalette();
    return Array.from({ length: MAX_RENDERED_SPARKS }, () => {
      return new THREE.ShaderMaterial({
        vertexShader: sparkVertexShader,
        fragmentShader: sparkFragmentShader,
        uniforms: {
          uOpacity: { value: 0 },
          uTime: { value: 0 },
          uSeed: { value: 0 },
          uSparkCore: { value: new THREE.Color(...pal.sparkCore) },
          uSparkMid: { value: new THREE.Color(...pal.sparkMid) },
          uSparkOuter: { value: new THREE.Color(...pal.sparkOuter) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
    });
  }, [controller]);

  const trailMaterials = useMemo(() => {
    const pal = controller.flame.getColorPalette();
    return Array.from({ length: MAX_RENDERED_SPARKS }, () =>
      Array.from({ length: TRAIL_SEGMENTS }, () => {
        return new THREE.ShaderMaterial({
          vertexShader: sparkVertexShader,
          fragmentShader: sparkFragmentShader,
          uniforms: {
            uOpacity: { value: 0 },
            uTime: { value: 0 },
            uSeed: { value: 0 },
            uSparkCore: { value: new THREE.Color(...pal.sparkCore) },
            uSparkMid: { value: new THREE.Color(...pal.sparkMid) },
            uSparkOuter: { value: new THREE.Color(...pal.sparkOuter) },
          },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
      })
    );
  }, [controller]);

  useEffect(() => {
    return () => {
      headMaterials.forEach((m) => m.dispose());
      trailMaterials.forEach((arr) => arr.forEach((m) => m.dispose()));
    };
  }, [headMaterials, trailMaterials]);

  useFrame(() => {
    const active = controller.sparks.getActiveSparks();
    const elapsed = controller.clock.getElapsed();
    const pal = controller.flame.getColorPalette();

    // Dynamically update spark color uniforms when palette changes
    if (lastPaletteRef.current !== pal) {
      lastPaletteRef.current = pal;
      const cCore = pal.sparkCore;
      const cMid = pal.sparkMid;
      const cOuter = pal.sparkOuter;
      for (let i = 0; i < MAX_RENDERED_SPARKS; i++) {
        headMaterials[i].uniforms.uSparkCore.value.setRGB(cCore[0], cCore[1], cCore[2]);
        headMaterials[i].uniforms.uSparkMid.value.setRGB(cMid[0], cMid[1], cMid[2]);
        headMaterials[i].uniforms.uSparkOuter.value.setRGB(cOuter[0], cOuter[1], cOuter[2]);
        for (let s = 0; s < TRAIL_SEGMENTS; s++) {
          trailMaterials[i][s].uniforms.uSparkCore.value.setRGB(cCore[0], cCore[1], cCore[2]);
          trailMaterials[i][s].uniforms.uSparkMid.value.setRGB(cMid[0], cMid[1], cMid[2]);
          trailMaterials[i][s].uniforms.uSparkOuter.value.setRGB(cOuter[0], cOuter[1], cOuter[2]);
        }
      }
    }

    for (let i = 0; i < MAX_RENDERED_SPARKS; i++) {
      const headMesh = headRefs.current[i];
      const mat = headMaterials[i];
      const spark = active[i];

      if (!spark) {
        if (headMesh) headMesh.visible = false;
        for (let s = 0; s < TRAIL_SEGMENTS; s++) {
          const tm = trailRefs.current[i]?.[s];
          if (tm) tm.visible = false;
        }
        continue;
      }

      const pos = controller.sparks.evaluatePosition(spark, spark.progress);
      // Smooth fade in at start and slight flare on approach
      const fadeIn = Math.min(1, spark.progress * 7.0);
      const fadeOut = spark.progress > 0.9 ? Math.max(0.2, (1 - spark.progress) * 10) : 1;
      const opacity = fadeIn * fadeOut;

      if (headMesh) {
        headMesh.visible = true;
        headMesh.position.set(pos.x, pos.y, 0.08);
      }
      mat.uniforms.uOpacity.value = opacity;
      mat.uniforms.uTime.value = elapsed;
      mat.uniforms.uSeed.value = spark.seed;

      // Render smooth golden trail behind spark
      for (let s = 0; s < TRAIL_SEGMENTS; s++) {
        const tm = trailRefs.current[i]?.[s];
        const tMat = trailMaterials[i][s];
        const frac = (s + 1) / (TRAIL_SEGMENTS + 1);
        const trailT = Math.max(0, spark.progress - frac * 0.14);
        const tPos = controller.sparks.evaluatePosition(spark, trailT);
        const scale = (1 - frac * 0.72) * 0.75;

        if (tm) {
          tm.visible = spark.progress > 0.01;
          tm.position.set(tPos.x, tPos.y, 0.075);
          tm.scale.setScalar(scale);
        }
        tMat.uniforms.uOpacity.value = opacity * (1 - frac) * 0.55;
        tMat.uniforms.uTime.value = elapsed;
        tMat.uniforms.uSeed.value = spark.seed + s * 0.3;
      }
    }
  });

  return (
    <group>
      {Array.from({ length: MAX_RENDERED_SPARKS }, (_, i) => (
        <group key={i}>
          <mesh
            ref={(el) => {
              headRefs.current[i] = el;
            }}
            visible={false}
            renderOrder={8}
            material={headMaterials[i]}
          >
            <planeGeometry args={[0.32, 0.32]} />
          </mesh>
          {Array.from({ length: TRAIL_SEGMENTS }, (__, s) => (
            <mesh
              key={s}
              ref={(el) => {
                trailRefs.current[i][s] = el;
              }}
              visible={false}
              renderOrder={7}
              material={trailMaterials[i][s]}
            >
              <planeGeometry args={[0.24, 0.24]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
