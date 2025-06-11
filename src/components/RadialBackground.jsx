export default function RadialBackground({
  left = "left-0",
  top = "top-0",
  size = "size-100",
  from = "from-red-500",
  via = "via-yellow-500",
  to = "to-green-500",
}) {
  return (
    <div
      className={`
        absolute
        ${left} ${top}
        ${size}
        bg-radial rounded-full ${from} ${via} ${to}
        blur-lg
        opacity-70
        animate-hue-rotate
        pointer-events-none
      `}
    />
  );
}
