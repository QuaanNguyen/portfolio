import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { GUESTBOOK_NOTES } from "./projects";
import { STRING_NOTES, pluckString } from "./stringAudio";

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const inverse = new THREE.Matrix4();
const localRay = new THREE.Ray();
const hit = new THREE.Vector3();
const localPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

function pointerInLocalPlane(scene, camera, object, planeZ) {
  if (!scene.pointer.inside) return null;
  ndc.set((scene.pointer.x / window.innerWidth) * 2 - 1, -(scene.pointer.y / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  inverse.copy(object.matrixWorld).invert();
  localRay.copy(raycaster.ray).applyMatrix4(inverse);
  localPlane.constant = -planeZ;
  return localRay.intersectPlane(localPlane, hit) ? { x: hit.x, y: hit.y } : null;
}

function useCanvasTexture(width, height, draw, deps) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.anisotropy = 4;
    return result;
  }, [width, height]);

  useEffect(() => {
    const paint = () => {
      const ctx = texture.image.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      draw(ctx, width, height);
      texture.needsUpdate = true;
    };
    paint();
    document.fonts?.ready.then(paint);
  }, [texture, ...deps]);

  return texture;
}

const GUITAR = {
  bridgeY: 62,
  nutY: 360,
  faceZ: 13.5,
  stringZ: 20,
  bridgeSpacing: 8.6,
  nutSpacing: 5.6,
  radii: [1.35, 1.2, 1.05, 0.85, 0.72, 0.62],
};

function bodyHalfWidth(y) {
  const lower = Math.sqrt(Math.max(0, 74 * 74 - (y - 74) ** 2));
  const upper = Math.sqrt(Math.max(0, 57 * 57 - (y - 170) ** 2));
  const k = 16;
  const h = Math.max(k - Math.abs(lower - upper), 0) / k;
  return Math.max(lower, upper) + h * h * k * 0.25;
}

function createBodyGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  for (let y = 1; y <= 226; y += 3) shape.lineTo(bodyHalfWidth(y), y);
  shape.lineTo(0, 227);
  for (let y = 226; y >= 1; y -= 3) shape.lineTo(-bodyHalfWidth(y), y);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 22,
    bevelEnabled: true,
    bevelThickness: 2.5,
    bevelSize: 2.5,
    bevelSegments: 3,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -11);
  return geometry;
}

function stringEndpoints(index) {
  const offset = index - 2.5;
  return {
    bridgeX: offset * GUITAR.bridgeSpacing,
    nutX: offset * GUITAR.nutSpacing,
  };
}

export function GuitarObject({ scene, anchorState, reducedMotion }) {
  const { camera } = useThree();
  const rootRef = useRef(null);
  const stringRefs = useRef([]);
  const vibration = useRef(STRING_NOTES.map(() => ({ start: -10, amp: 0 })));
  const previousHit = useRef(null);
  const bodyGeometry = useMemo(createBodyGeometry, []);

  const frets = useMemo(() => {
    const scaleLength = GUITAR.nutY - GUITAR.bridgeY;
    return Array.from({ length: 12 }, (_, i) => GUITAR.nutY - scaleLength * (1 - 2 ** (-(i + 1) / 12)));
  }, []);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    stringRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const v = vibration.current[i];
      const age = now - v.start;
      const wobble = reducedMotion ? 0 : v.amp * Math.sin(age * 90) * Math.exp(-age * 5);
      mesh.position.x = mesh.userData.baseX + wobble;
    });

    if (!rootRef.current || anchorState.progress < 0.6) {
      previousHit.current = null;
      return;
    }
    const point = pointerInLocalPlane(scene, camera, rootRef.current, GUITAR.stringZ);
    const inStrumZone = point && point.y > GUITAR.bridgeY - 30 && point.y < GUITAR.nutY + 6 && Math.abs(point.x) < 60;
    if (!inStrumZone) {
      previousHit.current = null;
      return;
    }
    const previous = previousHit.current;
    previousHit.current = point;
    if (!previous) return;

    const t = (point.y - GUITAR.bridgeY) / (GUITAR.nutY - GUITAR.bridgeY);
    const crossed = [];
    STRING_NOTES.forEach((note, i) => {
      const { bridgeX, nutX } = stringEndpoints(i);
      const stringX = bridgeX + (nutX - bridgeX) * Math.min(1, Math.max(0, t));
      if ((previous.x - stringX) * (point.x - stringX) < 0) crossed.push(i);
    });
    if (!crossed.length) return;
    const ordered = point.x > previous.x ? crossed : crossed.reverse();
    const speed = Math.min(1, Math.abs(point.x - previous.x) / 30);
    ordered.forEach((i, order) => {
      pluckString(i, order * 0.014, 0.65 + speed * 0.35);
      vibration.current[i] = { start: now + order * 0.014, amp: 1.8 };
    });
  });

  return (
    <group ref={rootRef} scale={0.78}>
      <mesh geometry={bodyGeometry} castShadow>
        <meshStandardMaterial attach="material-0" color="#e8c690" roughness={0.55} />
        <meshStandardMaterial attach="material-1" color="#8a532d" roughness={0.45} />
      </mesh>
      <mesh position={[0, 158, GUITAR.faceZ + 0.2]}>
        <circleGeometry args={[19, 40]} />
        <meshStandardMaterial color="#1a110b" roughness={1} />
      </mesh>
      <mesh position={[0, 158, GUITAR.faceZ + 0.15]}>
        <ringGeometry args={[21, 26, 48]} />
        <meshStandardMaterial color="#5a3a22" roughness={0.6} />
      </mesh>
      <mesh position={[0, GUITAR.bridgeY, GUITAR.faceZ + 1.6]} castShadow>
        <boxGeometry args={[58, 11, 3.2]} />
        <meshStandardMaterial color="#2b1a10" roughness={0.5} />
      </mesh>
      <mesh position={[0, GUITAR.bridgeY + 2, GUITAR.faceZ + 4]}>
        <boxGeometry args={[46, 1.6, 2]} />
        <meshStandardMaterial color="#f3ead8" />
      </mesh>
      <mesh position={[0, 290, GUITAR.faceZ - 3]} castShadow>
        <boxGeometry args={[27, 144, 9]} />
        <meshStandardMaterial color="#6b3f22" roughness={0.5} />
      </mesh>
      <mesh position={[0, 286, GUITAR.faceZ + 2.6]}>
        <boxGeometry args={[30, 150, 2.6]} />
        <meshStandardMaterial color="#2b1d15" roughness={0.7} />
      </mesh>
      {frets.map((y) => (
        <mesh key={y} position={[0, y, GUITAR.faceZ + 4.2]}>
          <boxGeometry args={[30, 1.1, 1]} />
          <meshStandardMaterial color="#d6d6d6" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, GUITAR.nutY, GUITAR.faceZ + 4.5]}>
        <boxGeometry args={[30, 3, 3]} />
        <meshStandardMaterial color="#f3ead8" />
      </mesh>
      <group position={[0, GUITAR.nutY + 1, GUITAR.faceZ - 1]} rotation={[-0.22, 0, 0]}>
        <mesh position={[0, 36, 0]} castShadow>
          <boxGeometry args={[36, 72, 7]} />
          <meshStandardMaterial color="#2b1d15" roughness={0.6} />
        </mesh>
        {[0, 1, 2].flatMap((row) =>
          [-1, 1].map((side) => (
            <mesh key={`${row}${side}`} position={[side * 22, 16 + row * 20, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[2.6, 2.6, 10, 10]} />
              <meshStandardMaterial color="#cfcfcf" metalness={0.7} roughness={0.3} />
            </mesh>
          ))
        )}
      </group>
      {STRING_NOTES.map((note, i) => {
        const { bridgeX, nutX } = stringEndpoints(i);
        const dx = nutX - bridgeX;
        const dy = GUITAR.nutY - GUITAR.bridgeY;
        const length = Math.hypot(dx, dy);
        const midX = (bridgeX + nutX) / 2;
        return (
          <mesh
            key={note.stringIndex}
            ref={(mesh) => {
              stringRefs.current[i] = mesh;
              if (mesh) mesh.userData.baseX = midX;
            }}
            position={[midX, (GUITAR.bridgeY + GUITAR.nutY) / 2, GUITAR.stringZ]}
            rotation={[0, 0, -Math.atan2(dx, dy)]}
            castShadow
          >
            <cylinderGeometry args={[GUITAR.radii[i], GUITAR.radii[i], length, 6]} />
            <meshStandardMaterial color={i < 3 ? "#d4a96a" : "#e6e6e6"} metalness={0.85} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

export function ChampionObject({ scene, anchorState, reducedMotion }) {
  const tiltRef = useRef(null);
  const motion = useRef({ rx: 0, ry: 0, vx: 0, vy: 0 });
  const capeGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(96, 150, 12, 12);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const flare = 1 + (75 - y) / 150;
      positions.setX(i, x * flare * 0.85);
      positions.setZ(i, -((x / 48) ** 2) * 16);
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  const questionTexture = useCanvasTexture(
    160,
    200,
    (ctx, w, h) => {
      ctx.font = '700 170px "Hedvig Letters Sans", Georgia, serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(255, 228, 163, 0.9)";
      ctx.shadowBlur = 22;
      ctx.fillStyle = "#ffe4a3";
      ctx.fillText("?", w / 2, h / 2 + 10);
    },
    []
  );

  useFrame((_, delta) => {
    const group = tiltRef.current;
    if (!group) return;
    const screen = scene.anchorScreen[anchorState.id];
    let targetY = 0;
    let targetX = 0;
    if (screen && scene.pointer.inside && anchorState.progress > 0.3) {
      targetY = Math.max(-1, Math.min(1, (scene.pointer.x - screen.x) / 220)) * 0.6;
      targetX = Math.max(-1, Math.min(1, (scene.pointer.y - screen.y) / 220)) * 0.32;
    }
    const m = motion.current;
    if (reducedMotion) {
      m.ry = targetY;
      m.rx = targetX;
    } else {
      const dt = Math.min(delta, 1 / 30);
      const stiffness = 90;
      const damping = 13;
      m.vy += ((targetY - m.ry) * stiffness - m.vy * damping) * dt;
      m.vx += ((targetX - m.rx) * stiffness - m.vx * damping) * dt;
      m.ry += m.vy * dt;
      m.rx += m.vx * dt;
    }
    group.rotation.set(m.rx, m.ry, 0);
  });

  const shell = <meshStandardMaterial color="#1b1d24" roughness={0.5} metalness={0.15} />;
  const plate = <meshStandardMaterial color="#262a35" roughness={0.35} metalness={0.4} />;

  return (
    <group ref={tiltRef}>
      {[-1, 1].map((side) => (
        <mesh key={`leg${side}`} position={[side * 13, 42, 0]} castShadow>
          <capsuleGeometry args={[10.5, 58, 6, 12]} />
          {shell}
        </mesh>
      ))}
      <RoundedBox args={[50, 24, 30]} radius={8} smoothness={3} position={[0, 84, 0]} castShadow>
        {shell}
      </RoundedBox>
      <RoundedBox args={[64, 74, 34]} radius={13} smoothness={4} position={[0, 128, 0]} castShadow>
        {shell}
      </RoundedBox>
      <RoundedBox args={[52, 46, 6]} radius={2.5} smoothness={2} position={[0, 132, 16]}>
        {plate}
      </RoundedBox>
      {[-1, 1].map((side) => (
        <group key={`arm${side}`}>
          <mesh position={[side * 44, 160, 0]} scale={[1.25, 0.8, 1.05]} castShadow>
            <sphereGeometry args={[19, 20, 14]} />
            {plate}
          </mesh>
          <mesh position={[side * 46, 116, 0]} rotation={[0, 0, side * 0.1]} castShadow>
            <capsuleGeometry args={[9, 56, 6, 12]} />
            {shell}
          </mesh>
        </group>
      ))}
      <mesh position={[0, 186, 0]} castShadow>
        <sphereGeometry args={[16, 24, 18]} />
        {shell}
      </mesh>
      <mesh position={[0, 196, -5]} rotation={[-0.18, 0, 0]} castShadow>
        <coneGeometry args={[26, 62, 28]} />
        {shell}
      </mesh>
      <mesh position={[0, 184, 15.5]}>
        <circleGeometry args={[11.5, 28]} />
        <meshBasicMaterial color="#050608" />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`eye${side}`} position={[side * 4.8, 186, 16.4]}>
          <sphereGeometry args={[2.1, 10, 8]} />
          <meshBasicMaterial color="#6d8bff" toneMapped={false} />
        </mesh>
      ))}
      <mesh geometry={capeGeometry} position={[0, 98, -20]} castShadow>
        <meshStandardMaterial color="#101116" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <group position={[64, 52, 8]} rotation={[0, 0, 0.1]}>
        <mesh position={[0, 74, 0]} castShadow>
          <boxGeometry args={[7, 118, 2.4]} />
          <meshStandardMaterial color="#3a3f4c" metalness={0.75} roughness={0.25} />
        </mesh>
        <mesh position={[0, 13, 0]} castShadow>
          <boxGeometry args={[28, 5, 7]} />
          {plate}
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[3, 3, 22, 8]} />
          {shell}
        </mesh>
      </group>
      <mesh position={[0, 128, 19.5]}>
        <planeGeometry args={[38, 48]} />
        <meshBasicMaterial map={questionTexture} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

const BUBBLE_ANCHORS = [
  [-122, 66, 10],
  [112, 104, 0],
  [-58, 162, 22],
  [78, 214, -6],
];

function measureNote(note) {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = '500 15px "Hedvig Letters Sans", sans-serif';
  return Math.ceil(Math.max(ctx.measureText(note.text).width, 60)) + 30;
}

function createTailGeometry(width, height) {
  const x = -width / 2 + 18;
  const y = -height / 2 + 4;
  const shape = new THREE.Shape();
  shape.moveTo(x, y);
  shape.lineTo(x + 16, y);
  shape.lineTo(x - 6, y - 16);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 8, bevelEnabled: false });
}

function Bubble({ note, width }) {
  const height = 46;
  const scale = 3;
  const geometry = useMemo(() => createTailGeometry(width, height), [width]);
  const texture = useCanvasTexture(
    width * scale,
    height * scale,
    (ctx) => {
      ctx.scale(scale, scale);
      ctx.fillStyle = "#17201c";
      ctx.font = '500 15px "Hedvig Letters Sans", sans-serif';
      ctx.textBaseline = "alphabetic";
      ctx.fillText(note.text, 15, 21);
      ctx.fillStyle = "#4f6ff6";
      ctx.font = '400 11px "Hedvig Letters Sans", sans-serif';
      ctx.fillText(`@${note.author}`, 15, 36);
    },
    [note.text, note.author, width]
  );

  return (
    <group>
      <RoundedBox args={[width, height, 14]} radius={6.5} smoothness={4} castShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.45} />
      </RoundedBox>
      <mesh geometry={geometry} position={[0, 0, -2]} castShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0, 7.3]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function BubblesObject({ scene, anchorState, reducedMotion }) {
  const { camera } = useThree();
  const rootRef = useRef(null);
  const bubbleRefs = useRef([]);
  const widths = useMemo(() => GUESTBOOK_NOTES.map(measureNote), []);
  const bodies = useRef(BUBBLE_ANCHORS.map(([x, y, z]) => ({ x, y, z, vx: 0, vy: 0 })));

  useFrame(({ clock }, delta) => {
    if (!rootRef.current) return;
    const dt = Math.min(delta, 1 / 30);
    const pointer = anchorState.progress > 0.4 ? pointerInLocalPlane(scene, camera, rootRef.current, 0) : null;
    const time = clock.elapsedTime;
    bodies.current.forEach((body, i) => {
      const [ax, ay] = BUBBLE_ANCHORS[i];
      const restY = ay + (reducedMotion ? 0 : Math.sin(time * 1.4 + i * 1.7) * 3);
      let fx = (ax - body.x) * 70;
      let fy = (restY - body.y) * 70;
      if (pointer) {
        const dx = body.x - pointer.x;
        const dy = body.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        const radius = 120;
        if (distance < radius && distance > 0.001) {
          const push = (1 - distance / radius) ** 2 * 9000;
          fx += (dx / distance) * push;
          fy += (dy / distance) * push;
        }
      }
      body.vx += (fx - body.vx * 11) * dt;
      body.vy += (fy - body.vy * 11) * dt;
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      const mesh = bubbleRefs.current[i];
      if (mesh) {
        mesh.position.set(body.x, body.y, body.z);
        mesh.rotation.z = reducedMotion ? 0 : Math.max(-0.35, Math.min(0.35, -body.vx * 0.0016));
      }
    });
  });

  return (
    <group ref={rootRef}>
      {GUESTBOOK_NOTES.map((note, i) => (
        <group key={note.author} ref={(g) => (bubbleRefs.current[i] = g)} position={BUBBLE_ANCHORS[i]}>
          <Bubble note={note} width={widths[i]} />
        </group>
      ))}
    </group>
  );
}
