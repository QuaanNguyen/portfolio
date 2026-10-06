import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PrototypeLogo from "../../portfolio/PrototypeLogo";
import SandSurface from "./SandSurface";
import ObjectStage from "./ObjectStage";
import { CARD_H, CARD_W, PROJECTS } from "./projects";
import {
  createSandField,
  engraveStrokes,
  fingerStroke,
  markWholeField,
  plowRect,
  pressRect,
  replayFingerStrokes,
  setObstacles,
  settleFully,
} from "./sandField";
import { defaultLettering } from "./sandLettering";
import { clampCardCenter, sandFieldExtent } from "./viewGeometry";
import { unlockStringAudio } from "./stringAudio";

const PLOW_DEPTH = 0.55;
const REST_LIFT = 3;
const DRAG_LIFT = 10;
const HOVER_MARGIN = 28;
const DRAG_THRESHOLD = 4;
const HISTORY_LIMIT = 40;
const FINGER_RADIUS_PX = 7;
const FINGER_DEPTH = 0.9;

const CARD_PADDING_X = 24;

function measureCardWidth(project) {
  const probe = document.createElement("div");
  probe.className = "pg-root";
  probe.style.visibility = "hidden";
  const lines = [
    ["h2", "pg-card-title", project.title],
    ["p", "pg-card-tagline", project.tagline],
  ].map(([tag, className, text]) => {
    const element = document.createElement(tag);
    element.className = className;
    element.style.display = "inline-block";
    element.textContent = text;
    probe.appendChild(element);
    return element;
  });
  document.body.appendChild(probe);
  const contentWidth = Math.max(...lines.map((element) => element.getBoundingClientRect().width));
  probe.remove();
  return Math.max(CARD_W, Math.ceil(contentWidth + CARD_PADDING_X * 2 + 4));
}

function initialCards() {
  return PROJECTS.map((project) => ({
    id: project.id,
    x: project.start.x * window.innerWidth,
    y: project.start.y * window.innerHeight,
    w: measureCardWidth(project),
    h: CARD_H,
    lift: REST_LIFT,
  }));
}

function createWorld() {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const extent = sandFieldExtent(Math.max(viewportW, window.screen?.width ?? 0), Math.max(viewportH, window.screen?.height ?? 0));
  const cards = initialCards();
  const lettering = defaultLettering(viewportW, viewportH);
  const field = createSandField({
    ...extent,
    viewportW,
    viewportH,
  });
  lettering.engraved.forEach(({ strokes, radiusPx, depth }) => engraveStrokes(field, strokes, radiusPx, depth));
  cards.forEach((card) => pressRect(field, card, 0.35));
  setObstacles(field, cards);
  settleFully(field);
  lettering.fingerDrawn.forEach(({ strokes, radiusPx }) => replayFingerStrokes(field, strokes, radiusPx, FINGER_DEPTH));
  settleFully(field);
  const scene = {
    cards,
    cardById: Object.fromEntries(cards.map((card) => [card.id, card])),
    cardsVersion: 0,
    cardEls: {},
    pointer: { x: 0, y: 0, inside: false },
    activeId: null,
    focusId: null,
    dragging: false,
    objectBoxes: {},
    anchorWorld: {},
    anchorScreen: {},
    wakeSand: null,
    wakeObjects: null,
  };
  return { field, scene, history: [] };
}

function positionCardElement(scene, card) {
  const element = scene.cardEls[card.id];
  if (!element) return;
  element.style.left = `${card.x}px`;
  element.style.top = `${card.y}px`;
  element.classList.toggle("is-lifted", card.lift > REST_LIFT);
}

function inflate(rect, margin) {
  return { x0: rect.x0 - margin, y0: rect.y0 - margin, x1: rect.x1 + margin, y1: rect.y1 + margin };
}

function contains(rect, x, y) {
  return x >= rect.x0 && x <= rect.x1 && y >= rect.y0 && y <= rect.y1;
}

function isUndoShortcut(event) {
  return (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "z";
}

export default function SandboxScene({ reducedMotion }) {
  const [world] = useState(createWorld);
  const { field, scene, history } = world;
  const dragRef = useRef(null);
  const fingerRef = useRef(null);

  const wake = useCallback(() => {
    scene.wakeSand?.();
    scene.wakeObjects?.();
  }, [scene]);

  const recordHistory = useCallback(() => {
    history.push({
      height: field.height.slice(),
      cards: scene.cards.map(({ id, x, y }) => ({ id, x, y })),
    });
    if (history.length > HISTORY_LIMIT) history.shift();
  }, [field, history, scene]);

  const undo = useCallback(() => {
    if (scene.dragging || dragRef.current || fingerRef.current) return;
    const entry = history.pop();
    if (!entry) return;
    field.height.set(entry.height);
    entry.cards.forEach(({ id, x, y }) => Object.assign(scene.cardById[id], { x, y, lift: REST_LIFT }));
    setObstacles(field, scene.cards);
    markWholeField(field);
    scene.cards.forEach((card) => positionCardElement(scene, card));
    scene.cardsVersion += 1;
    scene.activeId = null;
    wake();
  }, [field, history, scene, wake]);

  useEffect(() => {
    scene.cards.forEach((card) => positionCardElement(scene, card));
  }, [scene]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!isUndoShortcut(event)) return;
      event.preventDefault();
      undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo]);

  useEffect(() => {
    const updateHover = () => {
      const activeId = scene.activeId;
      if (!activeId || scene.dragging) return;
      const element = scene.cardEls[activeId];
      if (!element) return;
      const cardRect = element.getBoundingClientRect();
      let zone = { x0: cardRect.left, y0: cardRect.top, x1: cardRect.right, y1: cardRect.bottom };
      const objectBox = scene.objectBoxes[activeId];
      if (objectBox) {
        zone = {
          x0: Math.min(zone.x0, objectBox.x0),
          y0: Math.min(zone.y0, objectBox.y0),
          x1: Math.max(zone.x1, objectBox.x1),
          y1: Math.max(zone.y1, objectBox.y1),
        };
      }
      if (!scene.pointer.inside || !contains(inflate(zone, HOVER_MARGIN), scene.pointer.x, scene.pointer.y)) {
        scene.activeId = null;
        scene.wakeObjects?.();
      }
    };
    const onMove = (event) => {
      scene.pointer = { x: event.clientX, y: event.clientY, inside: true };
      updateHover();
    };
    const onLeave = () => {
      scene.pointer = { ...scene.pointer, inside: false };
      scene.activeId = null;
      scene.wakeObjects?.();
    };
    const onDown = () => unlockStringAudio();
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [scene]);

  const handleCardEnter = (id) => {
    if (scene.dragging) return;
    scene.activeId = id;
    scene.wakeObjects?.();
  };

  const handleCardDown = (id, event) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const card = scene.cardById[id];
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      grabX: event.clientX - card.x,
      grabY: event.clientY - card.y,
      moved: false,
    };
  };

  const handleCardMove = (id, event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== id || drag.pointerId !== event.pointerId) return;
    if (!drag.moved) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < DRAG_THRESHOLD) return;
      drag.moved = true;
      recordHistory();
      scene.dragging = true;
      scene.activeId = null;
    }
    const card = scene.cardById[id];
    const next = clampCardCenter(
      { x: event.clientX - drag.grabX, y: event.clientY - drag.grabY },
      window.innerWidth,
      window.innerHeight,
      card.w,
      CARD_H
    );
    const from = { ...card };
    card.x = next.x;
    card.y = next.y;
    card.lift = DRAG_LIFT;
    plowRect(field, from, card, PLOW_DEPTH);
    setObstacles(field, scene.cards);
    scene.cardsVersion += 1;
    positionCardElement(scene, card);
    wake();
  };

  const handleCardUp = (id, event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== id) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!drag.moved) return;
    const card = scene.cardById[id];
    card.lift = REST_LIFT;
    scene.dragging = false;
    scene.cardsVersion += 1;
    positionCardElement(scene, card);
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) {
      scene.activeId = id;
    }
    wake();
  };

  const handleSandDown = (event) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    fingerRef.current = { pointerId: event.pointerId, last: { x: event.clientX, y: event.clientY }, recorded: false };
    scene.dragging = true;
  };

  const handleSandMove = (event) => {
    const finger = fingerRef.current;
    if (!finger || finger.pointerId !== event.pointerId) return;
    const point = { x: event.clientX, y: event.clientY };
    if (!finger.recorded) {
      recordHistory();
      finger.recorded = true;
    }
    fingerStroke(field, finger.last, point, FINGER_RADIUS_PX, FINGER_DEPTH);
    finger.last = point;
    scene.wakeSand?.();
  };

  const handleSandUp = () => {
    if (!fingerRef.current) return;
    fingerRef.current = null;
    scene.dragging = false;
    scene.wakeSand?.();
  };

  return (
    <div className="pg-scene">
      <SandSurface
        field={field}
        scene={scene}
        reducedMotion={reducedMotion}
        onPointerDown={handleSandDown}
        onPointerMove={handleSandMove}
        onPointerUp={handleSandUp}
      />

      <div className="pg-card-layer">
        {PROJECTS.map((project) => (
          <article
            key={project.id}
            ref={(element) => {
              scene.cardEls[project.id] = element;
              if (element) positionCardElement(scene, scene.cardById[project.id]);
            }}
            className="pg-card"
            style={{ width: scene.cardById[project.id].w, height: CARD_H }}
            onPointerEnter={() => handleCardEnter(project.id)}
            onPointerDown={(event) => handleCardDown(project.id, event)}
            onPointerMove={(event) => handleCardMove(project.id, event)}
            onPointerUp={(event) => handleCardUp(project.id, event)}
            onPointerCancel={(event) => handleCardUp(project.id, event)}
          >
            <h2 className="pg-card-title">{project.title}</h2>
            <p className="pg-card-tagline">{project.tagline}</p>
          </article>
        ))}
      </div>

      <ObjectStage scene={scene} reducedMotion={reducedMotion} />

      <header className="pg-header">
        <Link to="/" className="pg-logo-link" aria-label="Back to portfolio">
          <PrototypeLogo tone="blue" size="hero" />
        </Link>
      </header>
    </div>
  );
}
