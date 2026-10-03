export default function RadialBackground({
  left = "left-0",
  md_left = "md:left-0",
  sm_left = "sm:left-0",
  top = "top-0",
  md_top = "md:top-0",
  sm_top = "sm:top-0",
  size = "size-100",
  md_size = "md:size-50",
  sm_size = "sm:size-25",
  from = "from-red-500",
  via = "via-yellow-500",
  to = "to-green-500",
}) {
  return (
    <div
      className={`
        absolute
        ${left} ${md_left} ${sm_left}
        ${md_top} ${sm_top}
         ${top}
        ${size}
        ${md_size} ${sm_size}
        bg-radial rounded-full ${from} ${via} ${to}
        blur-lg
        opacity-70
        animate-hue-rotate
        pointer-events-none
      `}
    />
  );
}
