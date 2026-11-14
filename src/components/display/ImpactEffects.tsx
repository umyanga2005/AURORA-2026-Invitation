import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import sparkVertexShader from '../../shaders/sparkVertex.glsl?raw';
import sparkFragmentShader from '../../shaders/sparkFragment.glsl?raw';
import type { ProgressiveIgnitionController } from '../../engine/IgnitionController';

interface ImpactEffectsProps {
  controller: ProgressiveIgnitionController;
}

const MAX_IMPACTS = 12;
const EMBERS_PER_IMPACT = 7;

export function ImpactEffects({ controller }: ImpactEffectsProps) {
  const flashRefs = useRef<(THREE.Mesh | null)[]>([]);
  const emberRefs = useRef<(THREE.Mesh | null)[][]>(
    Array.from({ length: MAX_IMPACTS }, () => [])
  );

  const flashMaterials = useMemo(() => {
    return Array.from({ length: MAX_IMPACTS }, () => {
      return new THREE.ShaderMaterial({
        vertexShader: sparkVertexShader,
        fragmentShader: sparkFragmentShader,
        uniforms: {
          uOpacity: { value: 0 },
          uTime: { value: 0 },
          uSeed: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
    });
  }, []);

  const emberMaterials = useMemo(() => {
    return Array.from({ length: MAX_IMPACTS }, () =>
      Array.from({ length: EMBERS_PER_IMPACT }, () => {
        return new THREE.ShaderMaterial({
          vertexShader: sparkVertexShader,
          fragmentShader: sparkFragmentShader,
          uniforms: {
            uOpacity: { value: 0 },
            uTime: { value: 0 },
            uSeed: { value: 0 },
          },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
      })
    );
  }, []);

  useEffect(() => {
    return () => {
      flashMaterials.forEach((m) => m.dispose());
      emberMaterials.forEach((arr) => arr.forEach((m) => m.dispose()));
    };
  }, [flashMaterials, emberMaterials]);

  useFrame(() => {
    const impacts = controller.sparks.getActiveImpacts();
    const elapsed = controller.clock.getElapsed();

    for (let i = 0; i < MAX_IMPACTS; i++) {
      const imp = impacts[i];
      const flashMesh = flashRefs.current[i];
      const fMat = flashMaterials[i];

      if (!imp) {
        if (flashMesh) flashMesh.visible = false;
        for (let e = 0; e < EMBERS_PER_IMPACT; e++) {
          const em = emberRefs.current[i]?.[e];
          if (em) em.visible = false;
        }
        continue;
      }

      const p = Math.min(1, imp.age / imp.duration);
      const flashOpacity = Math.sin(Math.min(1, p * 2.2) * Math.PI) * (1 - p);
      const flashScale = 0.65 + p * 1.15;

      if (flashMesh) {
        flashMesh.visible = true;
        flashMesh.position.set(imp.x, imp.y, 0.085);
        flashMesh.scale.setScalar(flashScale);
      }
      fMat.uniforms.uOpacity.value = Math.max(0, flashOpacity);
      fMat.uniforms.uTime.value = elapsed;
      fMat.uniforms.uSeed.value = imp.seed;

      // Small localized outward-moving embers
      for (let e = 0; e < EMBERS_PER_IMPACT; e++) {
        const em = emberRefs.current[i]?.[e];
        const eMat = emberMaterials[i][e];
        const angle = (e / EMBERS_PER_IMPACT) * Math.PI * 1.15 - Math.PI * 0.075 + Math.sin(imp.seed + e) * 0.25;
        const speed = 0.26 + ((imp.seed * 7 + e * 13) % 10) * 0.025;
        const ex = imp.x + Math.cos(angle) * speed * imp.age * 1.6;
        const ey = imp.y + Math.sin(angle) * speed * imp.age * 1.8 - 0.18 * imp.age * imp.age;
        const eOpacity = Math.max(0, 1 - p) * 0.9;

        if (em) {
          em.visible = true;
          em.position.set(ex, ey, 0.09);
          em.scale.setScalar(0.35 * (1 - p * 0.5));
        }
        eMat.uniforms.uOpacity.value = eOpacity;
        eMat.uniforms.uTime.value = elapsed;
        eMat.uniforms.uSeed.value = imp.seed + e * 1.9;
      }
    }
  });

  return (
    <group>
      {Array.from({ length: MAX_IMPACTS }, (_, i) => (
        <group key={i}>
          <mesh
            ref={(el) => {
              flashRefs.current[i] = el;
            }}
            visible={false}
            renderOrder={9}
            material={flashMaterials[i]}
          >
            <planeGeometry args={[0.48, 0.48]} />
          </mesh>
          {Array.from({ length: EMBERS_PER_IMPACT }, (__, e) => (
            <mesh
              key={e}
              ref={(el) => {
                emberRefs.current[i][e] = el;
              }}
              visible={false}
              renderOrder={9}
              material={emberMaterials[i][e]}
            >
              <planeGeometry args={[0.16, 0.16]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
