import { useCallback, useEffect, useRef, useState } from "react";
import {
  isLikelyLoop,
  resampleGesture,
  solveCausalGesture,
  tilePitchClass,
  tonicName,
} from "./musicModel";

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function pointFromEvent(event, canvas, previous) {
  const rect = canvas.getBoundingClientRect();
  const x = clamp((event.clientX - rect.left) / rect.width);
  const y = clamp((event.clientY - rect.top) / rect.height);
  const now = performance.now();
  const distance = previous ? Math.hypot(x - previous.x, y - previous.y) : 0;
  const elapsed = previous ? Math.max(16, now - previous.time) : 16;
  const velocity = clamp(distance / elapsed * 760, 0.12, 1);

  return {
    x,
    y,
    time: now,
    direction: previous && y < previous.y ? -1 : 1,
    velocity,
  };
}

function drawSmoothLine(context, points, width, height, closed) {
  if (!points.length) return;
  context.beginPath();
  context.moveTo(points[0].x * width, points[0].y * height);

  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index];
    const next = points[index + 1];
    const midpointX = (point.x + next.x) / 2 * width;
    const midpointY = (point.y + next.y) / 2 * height;
    context.quadraticCurveTo(point.x * width, point.y * height, midpointX, midpointY);
  }

  if (points.length > 1) {
    const last = points[points.length - 1];
    context.lineTo(last.x * width, last.y * height);
  }

  if (closed) context.closePath();
}

function roundRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function evenFloor(value, minimum) {
  const whole = Math.max(minimum, Math.floor(value));
  return whole % 2 === 0 ? whole : whole - 1;
}

function getGridMetrics(width, height) {
  const targetCellSize = clamp(Math.min(width, height) / 16, 22, 32);
  const crossGap = clamp(targetCellSize * 0.28, 6, 10);
  const columns = evenFloor((width - crossGap) / targetCellSize, 8);
  const rows = evenFloor((height - crossGap) / targetCellSize, 8);
  const cellSize = Math.min(
    (width - crossGap) / columns,
    (height - crossGap) / rows,
  );
  const gridWidth = columns * cellSize + crossGap;
  const gridHeight = rows * cellSize + crossGap;

  return {
    cellSize,
    columns,
    crossGap,
    originX: (width - gridWidth) / 2,
    originY: (height - gridHeight) / 2,
    rows,
  };
}

function cellCenter(index, count, origin, cellSize, crossGap) {
  return origin
    + index * cellSize
    + cellSize / 2
    + (index >= count / 2 ? crossGap : 0);
}

function tonicFromCanvasPoint(point, width, height) {
  const metrics = getGridMetrics(width, height);
  let column = 0;
  let row = 0;
  let columnDistance = Number.POSITIVE_INFINITY;
  let rowDistance = Number.POSITIVE_INFINITY;
  const pixelX = point.x * width;
  const pixelY = point.y * height;

  for (let index = 0; index < metrics.columns; index += 1) {
    const distance = Math.abs(pixelX - cellCenter(
      index,
      metrics.columns,
      metrics.originX,
      metrics.cellSize,
      metrics.crossGap,
    ));
    if (distance < columnDistance) {
      column = index;
      columnDistance = distance;
    }
  }

  for (let index = 0; index < metrics.rows; index += 1) {
    const distance = Math.abs(pixelY - cellCenter(
      index,
      metrics.rows,
      metrics.originY,
      metrics.cellSize,
      metrics.crossGap,
    ));
    if (distance < rowDistance) {
      row = index;
      rowDistance = distance;
    }
  }

  return tilePitchClass(column, row);
}

function drawEndpoint(context, point, width, height, accent, label, filled) {
  if (!point) return;
  const x = point.x * width;
  const y = point.y * height;
  context.save();
  context.beginPath();
  context.arc(x, y, 5.5, 0, Math.PI * 2);
  context.fillStyle = filled ? accent : "#f8f9f4";
  context.fill();
  context.strokeStyle = filled ? "#f8f9f4" : accent;
  context.lineWidth = 2;
  context.stroke();
  context.font = "700 8px ui-sans-serif, system-ui, sans-serif";
  context.fillStyle = "rgba(20,31,27,0.66)";
  context.textBaseline = "middle";
  context.fillText(label, clamp(x + 9, 5, width - 36), clamp(y + 1, 8, height - 8));
  context.restore();
}

function drawScene(context, width, height, renderState, time, accent) {
  const metrics = getGridMetrics(width, height);
  const tileGap = clamp(metrics.cellSize * 0.12, 2.4, 3.6);
  const tileSize = metrics.cellSize - tileGap;
  const activeEvent = renderState.path?.events?.[Math.max(0, renderState.playheadIndex)]
    ?? renderState.path?.events?.at(-1);
  const activePitchClasses = activeEvent?.chord?.pitchClasses ?? [];

  context.fillStyle = "#e9ebe8";
  context.fillRect(0, 0, width, height);

  for (let row = 0; row < metrics.rows; row += 1) {
    for (let column = 0; column < metrics.columns; column += 1) {
      const x = metrics.originX
        + column * metrics.cellSize
        + (column >= metrics.columns / 2 ? metrics.crossGap : 0)
        + tileGap / 2;
      const y = metrics.originY
        + row * metrics.cellSize
        + (row >= metrics.rows / 2 ? metrics.crossGap : 0)
        + tileGap / 2;
      const pitchClass = tilePitchClass(column, row);
      const shimmer = (Math.sin(time * 0.0018 + column * 2.17 + row * 3.31) + 1) / 2;
      const glint = Math.pow(shimmer, 9);
      const isRoot = pitchClass === activeEvent?.chord?.rootPc;
      const isTone = activePitchClasses.includes(pitchClass);
      const alpha = isRoot ? 0.46 : isTone ? 0.2 : 0.028 + shimmer * 0.025 + glint * 0.09;

      context.fillStyle = isRoot
        ? `rgba(76, 176, 94, ${alpha})`
        : `rgba(24, 42, 35, ${alpha})`;
      roundRect(context, x, y, tileSize, tileSize, Math.min(3, tileSize * 0.12));
      context.fill();
    }
  }

  context.strokeStyle = "rgba(20, 31, 27, 0.14)";
  context.lineWidth = 1;
  context.setLineDash([3, 5]);
  context.beginPath();
  context.moveTo(width / 2, 0);
  context.lineTo(width / 2, height);
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.stroke();
  context.setLineDash([]);

  const points = renderState.path?.points ?? [];
  if (points.length) {
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "rgba(247, 248, 242, 0.86)";
    context.lineWidth = 8;
    drawSmoothLine(context, points, width, height, renderState.path.closed);
    context.stroke();

    context.strokeStyle = renderState.path?.source === "sample"
      ? "rgba(13, 126, 112, 0.34)"
      : accent;
    context.lineWidth = 3.4;
    drawSmoothLine(context, points, width, height, renderState.path.closed);
    context.stroke();

    if (renderState.path?.source === "sample" && renderState.playheadIndex >= 0) {
      const travelled = points.slice(0, renderState.playheadIndex + 1);
      context.strokeStyle = accent;
      context.lineWidth = 4;
      drawSmoothLine(context, travelled, width, height, false);
      context.stroke();
    }
    context.restore();

  }

  const events = renderState.path?.events ?? [];
  const sampleLabels = renderState.path?.source === "sample"
    ? [...events.reduce((groups, event, index) => {
      const label = event.chord.label;
      const group = groups.get(label) ?? { event, indices: [] };
      group.indices.push(index);
      groups.set(label, group);
      return groups;
    }, new Map()).values()]
    : null;
  const labels = sampleLabels ?? events.map((event, index) => ({ event, indices: [index] }));
  const labelStride = sampleLabels ? 1 : events.length > 15 ? 3 : events.length > 10 ? 2 : 1;
  const labelBoxes = [];
  labels.forEach(({ event, indices }, labelIndex) => {
    const index = indices[0];
    const isPlaying = indices.includes(renderState.playheadIndex);
    if (labelIndex % labelStride !== 0 && index !== events.length - 1 && !isPlaying) return;
    const x = event.point.x * width;
    const y = event.point.y * height;
    const label = renderState.path?.source === "sample"
      ? `${event.chord.label}${indices.length > 1 ? ` ×${indices.length}` : ""}`
      : event.chord.label;
    context.font = "600 11px ui-sans-serif, system-ui, sans-serif";
    const labelWidth = context.measureText(label).width + 14;
    const labelX = clamp(x + 8, 4, width - labelWidth - 4);
    const verticalOffsets = [-25, 8, -54, 37, -83, 66, -112, 95];
    let labelY = clamp(y + verticalOffsets[0], 4, height - 26);
    for (const offset of verticalOffsets) {
      const candidateY = clamp(y + offset, 4, height - 26);
      const overlaps = labelBoxes.some((box) => (
        labelX < box.x + box.width + 4
        && labelX + labelWidth + 4 > box.x
        && candidateY < box.y + box.height + 4
        && candidateY + 22 + 4 > box.y
      ));
      if (!overlaps) {
        labelY = candidateY;
        break;
      }
    }
    labelBoxes.push({ x: labelX, y: labelY, width: labelWidth, height: 22 });
    context.fillStyle = isPlaying ? accent : "rgba(248, 249, 244, 0.94)";
    context.strokeStyle = isPlaying ? "rgba(255,255,255,0.72)" : "rgba(20,31,27,0.18)";
    context.lineWidth = 1;
    roundRect(context, labelX, labelY, labelWidth, 22, 7);
    context.fill();
    context.stroke();
    context.fillStyle = isPlaying ? "#ffffff" : "#14221c";
    context.textBaseline = "middle";
    context.fillText(label, labelX + 7, labelY + 11.5);
  });

  if (points.length) {
    drawEndpoint(
      context,
      points[0],
      width,
      height,
      accent,
      renderState.path.closed ? "loop" : "",
      false,
    );
    if (!renderState.path.closed && points.length > 1) {
      drawEndpoint(context, points.at(-1), width, height, accent, "", true);
    }
  }

  if (renderState.hover && !renderState.drawing) {
    const x = renderState.hover.x * width;
    const y = renderState.hover.y * height;
    context.strokeStyle = "rgba(25, 38, 32, 0.4)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x - 7, y);
    context.lineTo(x + 7, y);
    context.moveTo(x, y - 7);
    context.lineTo(x, y + 7);
    context.stroke();
  }
}

export default function HarmonicCanvas({
  accent = "#176bff",
  bpm = 66,
  onBpmChange,
  onGestureComplete,
  onPathChange,
  onPolish,
  path,
  playheadIndex = -1,
}) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const eventPointsRef = useRef([]);
  const eventStepRef = useRef(0.05);
  const rawPointsRef = useRef([]);
  const lastPointRef = useRef(null);
  const pathRef = useRef(path);
  const renderStateRef = useRef({ path, hover: null, drawing: false, playheadIndex });
  const [hover, setHover] = useState(null);

  useEffect(() => {
    pathRef.current = path;
    renderStateRef.current = {
      ...renderStateRef.current,
      path,
      playheadIndex,
    };
  }, [path, playheadIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let frameId = 0;
    let width = 0;
    let height = 0;
    let context = null;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (time) => {
      if (context && width && height) {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        drawScene(context, width, height, renderStateRef.current, time, accent);
      }
      frameId = window.requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    frameId = window.requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, [accent]);

  const publishPath = useCallback((rawPoints, tonicPc, closed) => {
    const eventPoints = eventPointsRef.current;
    const committedChords = pathRef.current?.source === "gesture"
      ? pathRef.current.events.map((event) => event.chord)
      : [];
    const chords = solveCausalGesture(eventPoints, tonicPc, committedChords);
    const nextPath = {
      id: pathRef.current?.source === "gesture" ? pathRef.current.id : `gesture-${Date.now()}`,
      title: "Untitled line",
      creator: "",
      tonicPc,
      closed,
      points: rawPoints,
      events: eventPoints.map((point, index) => ({
        point: { ...point, durationBeats: 2, velocity: 0.54 },
        chord: chords[index],
      })),
      source: "gesture",
    };
    pathRef.current = nextPath;
    renderStateRef.current = { ...renderStateRef.current, path: nextPath };
    onPathChange(nextPath);
    return nextPath;
  }, [onPathChange]);

  const handlePointerDown = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event, canvas, null);
    const rect = canvas.getBoundingClientRect();
    const tonicPc = tonicFromCanvasPoint(point, rect.width, rect.height);
    pathRef.current = null;
    drawingRef.current = true;
    eventPointsRef.current = [point];
    eventStepRef.current = 46 / Math.max(320, Math.hypot(rect.width, rect.height));
    rawPointsRef.current = [point];
    lastPointRef.current = point;
    renderStateRef.current = { ...renderStateRef.current, drawing: true, hover: point };
    publishPath([point], tonicPc, false);
  }, [publishPath]);

  const handlePointerMove = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = pointFromEvent(event, canvas, lastPointRef.current);
    setHover(point);
    renderStateRef.current = { ...renderStateRef.current, hover: point };
    if (!drawingRef.current) return;

    const previous = lastPointRef.current;
    const movement = previous ? Math.hypot(point.x - previous.x, point.y - previous.y) : 0;
    if (previous && movement < 0.0025) return;
    lastPointRef.current = point;
    rawPointsRef.current = [...rawPointsRef.current, point];
    eventPointsRef.current = resampleGesture(
      rawPointsRef.current,
      eventStepRef.current,
      { includeEndpoint: false },
    );
    const rect = canvas.getBoundingClientRect();
    const tonicPc = pathRef.current?.tonicPc
      ?? tonicFromCanvasPoint(rawPointsRef.current[0], rect.width, rect.height);
    publishPath(rawPointsRef.current, tonicPc, false);
  }, [publishPath]);

  const finishGesture = useCallback((event) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const step = 46 / Math.max(320, Math.hypot(rect.width, rect.height));
    const finalPoint = pointFromEvent(event, canvas, lastPointRef.current);
    if (!lastPointRef.current || Math.hypot(
      finalPoint.x - lastPointRef.current.x,
      finalPoint.y - lastPointRef.current.y,
    ) >= 0.0025) {
      rawPointsRef.current = [...rawPointsRef.current, finalPoint];
      lastPointRef.current = finalPoint;
    }
    const loopPoints = resampleGesture(rawPointsRef.current, step, { includeEndpoint: true });
    const closed = isLikelyLoop(loopPoints, step * 1.35);
    const tonicPc = pathRef.current?.tonicPc
      ?? tonicFromCanvasPoint(rawPointsRef.current[0], rect.width, rect.height);
    eventPointsRef.current = loopPoints;
    const nextPath = publishPath(rawPointsRef.current, tonicPc, closed);
    renderStateRef.current = { ...renderStateRef.current, drawing: false };
    onGestureComplete?.(nextPath);
  }, [onGestureComplete, publishPath]);

  const toggleLoop = useCallback(() => {
    if (!pathRef.current?.points?.length || pathRef.current.source !== "gesture") return;
    publishPath(pathRef.current.points, pathRef.current.tonicPc, !pathRef.current.closed);
  }, [publishPath]);

  const clear = useCallback(() => {
    pathRef.current = null;
    eventPointsRef.current = [];
    rawPointsRef.current = [];
    renderStateRef.current = { ...renderStateRef.current, path: null };
    onPathChange(null);
  }, [onPathChange]);

  return (
    <div className="harmonic-canvas-shell">
      <canvas
        ref={canvasRef}
        className="harmonic-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishGesture}
        onPointerCancel={finishGesture}
        aria-label="Draw a path across a harmonic grid. Left is minor, right is major, bottom is simple, and top is harmonically complex."
        role="application"
        tabIndex={0}
      />
      <div className="axis-label axis-label-left">minor</div>
      <div className="axis-label axis-label-right">major</div>
      <div className="axis-label axis-label-top">extended</div>
      <div className="axis-label axis-label-bottom">triad</div>
      <div className="canvas-toolbar">
        <span>{path ? `${tonicName(path.tonicPc)} root locked` : hover && canvasRef.current ? `${tonicName(tonicFromCanvasPoint(hover, canvasRef.current.clientWidth, canvasRef.current.clientHeight))} on this tile` : "draw, then release to hear"}</span>
        <label className="tempo-control">
          <strong>{bpm} bpm</strong>
          <input
            type="range"
            min="42"
            max="128"
            step="1"
            value={bpm}
            onChange={(event) => onBpmChange?.(Number(event.target.value))}
            aria-label="Playback tempo"
          />
        </label>
        <button type="button" onClick={toggleLoop} disabled={!path || path.source !== "gesture"}>
          {path?.closed ? "loop on" : "open line"}
        </button>
        <button
          type="button"
          onClick={onPolish}
          disabled={!path || path.source !== "gesture" || path.events.length < 2 || path.polished}
          title="Globally optimize the completed line and replay it"
        >
          {path?.polished ? "polished" : "polish"}
        </button>
        <button type="button" onClick={clear} disabled={!path}>clear</button>
      </div>
    </div>
  );
}
