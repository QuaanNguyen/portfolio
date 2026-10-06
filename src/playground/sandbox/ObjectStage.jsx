import { useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CARD_H, PROJECTS } from "./projects";
import { OBJECT_PITCH, PERSPECTIVE_PX } from "./viewGeometry";
import { BubblesObject, ChampionObject, GuitarObject } from "./objects3d";

const OBJECT_SETUP = {
  "chord-studio": { Component: GuitarObject, base: [-6, -CARD_H * 0.28], spin: -0.38 },
  "league-impostor": { Component: ChampionObject, base: [0, -CARD_H * 0.3], spin: 0 },
  guestbook: { Component: BubblesObject, base: [0, -CARD_H * 0.3], spin: 0 },
};

const RISE_DEPTH = 380;
const SHADOW_CATCHER_SIZE = 1100;
const corner = new THREE.Vector3();
const box = new THREE.Box3();
const normal = new THREE.Vector3();
const facePoint = new THREE.Vector3();

function CameraRig() {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    camera.fov = (2 * Math.atan(size.height / 2 / PERSPECTIVE_PX) * 180) / Math.PI;
    camera.aspect = size.width / size.height;
    camera.near = 10;
    camera.far = 6000;
    camera.position.set(0, 0, PERSPECTIVE_PX);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function WakeBridge({ scene }) {
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    scene.wakeObjects = invalidate;
    return () => {
      scene.wakeObjects = null;
    };
  }, [scene, invalidate]);
  return null;
}

function LightRig({ scene }) {
  const keyRef = useRef(null);
  const rimRef = useRef(null);
  const target = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    const focus = scene.anchorWorld[scene.focusId];
    if (!focus || !keyRef.current) return;
    target.position.copy(focus);
    target.updateMatrixWorld();
    keyRef.current.position.set(focus.x - 300, focus.y + 340, focus.z + 560);
    rimRef.current.position.set(focus.x + 120, focus.y + 380, focus.z - 420);
  });

  return (
    <>
      <primitive object={target} />
      <hemisphereLight args={["#fff8ec", "#b89a74", 1.9]} />
      <directionalLight
        ref={keyRef}
        target={target}
        intensity={3.2}
        color="#fff3dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-460}
        shadow-camera-right={460}
        shadow-camera-top={460}
        shadow-camera-bottom={-460}
        shadow-camera-near={10}
        shadow-camera-far={2400}
      />
      <directionalLight ref={rimRef} target={target} intensity={0.9} color="#9fb2ff" />
    </>
  );
}

function CardAnchor({ project, scene, reducedMotion }) {
  const { camera, size, invalidate } = useThree();
  const cardRef = useRef(null);
  const riseRef = useRef(null);
  const objectRef = useRef(null);
  const catcherRef = useRef(null);
  const clipPlane = useMemo(() => new THREE.Plane(), []);
  const anchorState = useRef({ id: project.id, progress: 0, velocity: 0 }).current;
  const { Component, base, spin } = OBJECT_SETUP[project.id];

  useLayoutEffect(() => {
    objectRef.current?.traverse((child) => {
      if (!child.isMesh) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        material.clippingPlanes = [clipPlane];
        material.clipShadows = true;
      });
    });
  });

  useFrame((_, delta) => {
    const card = scene.cardById[project.id];
    if (!card || !cardRef.current) return;
    const dt = Math.min(delta, 1 / 30);
    const active = scene.activeId === project.id && !scene.dragging;
    const target = active ? 1 : 0;

    if (reducedMotion) {
      anchorState.progress = target;
      anchorState.velocity = 0;
    } else {
      const stiffness = active ? 170 : 420;
      const damping = active ? 19 : 42;
      anchorState.velocity += ((target - anchorState.progress) * stiffness - anchorState.velocity * damping) * dt;
      anchorState.progress += anchorState.velocity * dt;
      if (!active && anchorState.progress < 0.002) {
        anchorState.progress = 0;
        anchorState.velocity = 0;
      }
    }

    cardRef.current.position.set(card.x - size.width / 2, size.height / 2 - card.y, 0);
    const progress = anchorState.progress;
    riseRef.current.position.set(base[0], base[1], (Math.min(progress, 1.08) - 1) * RISE_DEPTH);
    const visible = progress > 0.001;
    riseRef.current.visible = visible;
    catcherRef.current.visible = visible;
    catcherRef.current.material.opacity = 0.26 * Math.min(1, Math.max(0, progress));

    cardRef.current.updateWorldMatrix(true, false);
    normal.set(0, 0, 1).transformDirection(cardRef.current.matrixWorld);
    cardRef.current.getWorldPosition(facePoint);
    clipPlane.setFromNormalAndCoplanarPoint(normal, facePoint.clone().addScaledVector(normal, -0.5));

    scene.anchorWorld[project.id] = facePoint.clone();
    corner.copy(facePoint).project(camera);
    scene.anchorScreen[project.id] = {
      x: ((corner.x + 1) / 2) * size.width,
      y: ((1 - corner.y) / 2) * size.height,
    };

    if (visible && progress > 0.25) {
      riseRef.current.updateWorldMatrix(true, true);
      box.setFromObject(objectRef.current);
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (let i = 0; i < 8; i++) {
        corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
        corner.project(camera);
        const sx = ((corner.x + 1) / 2) * size.width;
        const sy = ((1 - corner.y) / 2) * size.height;
        x0 = Math.min(x0, sx);
        y0 = Math.min(y0, sy);
        x1 = Math.max(x1, sx);
        y1 = Math.max(y1, sy);
      }
      scene.objectBoxes[project.id] = { x0, y0, x1, y1 };
    } else {
      scene.objectBoxes[project.id] = null;
    }
    if (active) scene.focusId = project.id;
    if (active || visible) invalidate();
  });

  return (
    <group ref={cardRef}>
      <mesh ref={catcherRef} position={[0, 0, 0.4]} scale={[SHADOW_CATCHER_SIZE, SHADOW_CATCHER_SIZE, 1]} receiveShadow>
        <planeGeometry args={[1, 1]} />
        <shadowMaterial transparent opacity={0.26} color="#3b2a17" />
      </mesh>
      <group ref={riseRef}>
        <group rotation={[0, 0, spin]}>
          <group rotation={[OBJECT_PITCH, 0, 0]}>
            <group ref={objectRef}>
              <Component scene={scene} anchorState={anchorState} reducedMotion={reducedMotion} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export default function ObjectStage({ scene, reducedMotion }) {
  return (
    <Canvas
      className="pg-object-canvas"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 30 }}
      frameloop="demand"
      shadows
      flat
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, localClippingEnabled: true }}
      camera={{ position: [0, 0, PERSPECTIVE_PX], fov: 50, near: 10, far: 6000 }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
      }}
    >
      <CameraRig />
      <WakeBridge scene={scene} />
      <LightRig scene={scene} />
      {PROJECTS.map((project) => (
        <CardAnchor key={project.id} project={project} scene={scene} reducedMotion={reducedMotion} />
      ))}
    </Canvas>
  );
}
