import { useEffect, useRef } from "react";
import { CELL_PX, settleStep } from "./sandField";
import { MAX_CARDS, VERTEX_SOURCE, fragmentSource } from "./sandShader";

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "shader compile failed");
  }
  return shader;
}

function createProgram(gl, manualBilinear) {
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SOURCE));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource(manualBilinear)));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "program link failed");
  }
  return program;
}

export default function SandSurface({ field, scene, reducedMotion, onPointerDown, onPointerMove, onPointerUp }) {
  const canvasRef = useRef(null);
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) return undefined;
    gl.getExtension("EXT_color_buffer_float");
    const linearFloat = Boolean(gl.getExtension("OES_texture_float_linear"));
    const program = createProgram(gl, !linearFloat);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const heightTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, heightTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, field.cols, field.rows, 0, gl.RED, gl.FLOAT, field.height);
    const filter = linearFloat ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    field.uploadRows = null;

    const uniform = (name) => gl.getUniformLocation(program, name);
    const u = {
      viewport: uniform("uViewport"),
      cards: uniform("uCards"),
      cardLift: uniform("uCardLift"),
      cardCount: uniform("uCardCount"),
    };
    gl.uniform1i(uniform("uHeight"), 0);
    gl.uniform2f(uniform("uGridSize"), field.cols, field.rows);
    gl.uniform2f(uniform("uGridOrigin"), field.originX, field.originY);
    gl.uniform1f(uniform("uCellPx"), CELL_PX);

    const cardData = new Float32Array(MAX_CARDS * 4);
    const liftData = new Float32Array(MAX_CARDS);
    let lastSignature = "";
    let frame = 0;

    const tick = () => {
      frame = 0;
      settleStep(field, { disturbing: scene.dragging, instant: reducedMotionRef.current });

      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      if (canvas.width !== viewportW || canvas.height !== viewportH) {
        canvas.width = viewportW;
        canvas.height = viewportH;
      }

      const rows = field.uploadRows;
      if (rows) {
        const y0 = Math.max(0, rows.y0);
        const y1 = Math.min(field.rows - 1, rows.y1);
        gl.texSubImage2D(
          gl.TEXTURE_2D,
          0,
          0,
          y0,
          field.cols,
          y1 - y0 + 1,
          gl.RED,
          gl.FLOAT,
          field.height.subarray(y0 * field.cols, (y1 + 1) * field.cols)
        );
        field.uploadRows = null;
      }

      const signature = `${viewportW}x${viewportH}|${scene.cardsVersion}`;
      if (rows || signature !== lastSignature) {
        lastSignature = signature;
        scene.cards.forEach((card, i) => {
          cardData.set([card.x, card.y, card.w / 2, card.h / 2], i * 4);
          liftData[i] = card.lift;
        });
        gl.viewport(0, 0, viewportW, viewportH);
        gl.uniform2f(u.viewport, viewportW, viewportH);
        gl.uniform4fv(u.cards, cardData);
        gl.uniform1fv(u.cardLift, liftData);
        gl.uniform1i(u.cardCount, Math.min(MAX_CARDS, scene.cards.length));
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      if (field.dirty || field.uploadRows) frame = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    scene.wakeSand = wake;
    window.addEventListener("resize", wake);
    wake();

    return () => {
      window.removeEventListener("resize", wake);
      if (frame) cancelAnimationFrame(frame);
      scene.wakeSand = null;
    };
  }, [field, scene]);

  return (
    <canvas
      ref={canvasRef}
      className="pg-sand-canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-hidden="true"
    />
  );
}
