import { useEffect, useRef, useState } from "react";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function coverRect(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  if (sourceRatio > targetRatio) {
    const width = sourceHeight * targetRatio;
    return { x: (sourceWidth - width) / 2, y: 0, width, height: sourceHeight };
  }

  const height = sourceWidth / targetRatio;
  return { x: 0, y: (sourceHeight - height) / 2, width: sourceWidth, height };
}

function luminance(pixels, index) {
  return (pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722) / 255;
}

function localContrast(pixels, column, row, columns, rows) {
  const center = luminance(pixels, (row * columns + column) * 4);
  const neighbors = [
    [column - 1, row],
    [column + 1, row],
    [column, row - 1],
    [column, row + 1],
  ];
  const differences = neighbors.map(([nextColumn, nextRow]) => {
    const safeColumn = clamp(nextColumn, 0, columns - 1);
    const safeRow = clamp(nextRow, 0, rows - 1);
    return Math.abs(center - luminance(pixels, (safeRow * columns + safeColumn) * 4));
  });
  return differences.reduce((sum, value) => sum + value, 0) / differences.length;
}

function renderGlyphfield(context, image, width, height) {
  const cell = clamp(Math.round(width / 160), 3, 6);
  const columns = Math.max(1, Math.ceil(width / cell));
  const rows = Math.max(1, Math.ceil(height / cell));
  const sample = document.createElement("canvas");
  sample.width = columns;
  sample.height = rows;
  const sampleContext = sample.getContext("2d", { willReadFrequently: true });
  const crop = coverRect(image.naturalWidth, image.naturalHeight, columns, rows);

  sampleContext.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    columns,
    rows,
  );

  const pixels = sampleContext.getImageData(0, 0, columns, rows).data;
  context.clearRect(0, 0, width, height);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `600 ${cell * 0.95}px ui-monospace, SFMono-Regular, Menlo, monospace`;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = (row * columns + column) * 4;
      const lightness = luminance(pixels, index);
      const contrast = localContrast(pixels, column, row, columns, rows);
      const alpha = clamp((0.72 - lightness) * 0.75 + contrast * 1.6, 0, 0.38);
      if (alpha < 0.035) continue;
      context.fillStyle = `rgba(17, 29, 23, ${alpha})`;
      context.fillText("0", column * cell + cell / 2, row * cell + cell / 2);
    }
  }
}

export default function DitherCanvas({ src, mode = "glyphfield", className = "" }) {
  const frameRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const animationFrameRef = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!frame || !canvas || !image) return undefined;

    const draw = () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = window.requestAnimationFrame(() => {
        const rect = frame.getBoundingClientRect();
        if (!rect.width || !rect.height || !image.complete || !image.naturalWidth) return;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(rect.width * ratio);
        canvas.height = Math.round(rect.height * ratio);
        const context = canvas.getContext("2d");
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        renderGlyphfield(context, image, rect.width, rect.height);
        setReady(true);
      });
    };

    image.addEventListener("load", draw);
    const observer = new ResizeObserver(draw);
    observer.observe(frame);
    if (image.complete) draw();

    return () => {
      image.removeEventListener("load", draw);
      observer.disconnect();
      window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, [src]);

  return (
    <span ref={frameRef} className={`texture-image texture-${mode} ${ready ? "is-ready" : ""} ${className}`}>
      <img ref={imageRef} src={src} alt="White Sands in the Tularosa Basin" />
      <canvas ref={canvasRef} aria-hidden="true" />
    </span>
  );
}
