export const PERSPECTIVE_PX = 1100;
export const OBJECT_PITCH = 0.62;

const FIELD_MARGIN = 40;

export function sandFieldExtent(viewportW, viewportH) {
  return {
    originX: -FIELD_MARGIN,
    originY: -FIELD_MARGIN,
    widthPx: viewportW + FIELD_MARGIN * 2,
    heightPx: viewportH + FIELD_MARGIN * 2,
  };
}

export function clampCardCenter(center, viewportW, viewportH, cardW, cardH) {
  const marginX = cardW * 0.5 + 12;
  const marginTop = cardH * 0.5 + 72;
  const marginBottom = cardH * 0.5 + 12;
  return {
    x: Math.min(viewportW - marginX, Math.max(marginX, center.x)),
    y: Math.min(viewportH - marginBottom, Math.max(marginTop, center.y)),
  };
}
