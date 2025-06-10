export default function RadialBackground() {
  return (
    <div className="z-0">
      <div className="absolute left-1/15 size-200 rounded-full bg-radial from-orange-600 to-gray-100 to-70% dark:to-neutral-900 transition-colors pointer-events-none animate-pulseSlow"></div>
      <div className="absolute bottom-1/15 right-1/10 size-130 rounded-full bg-radial from-yellow-600 to-gray-100 to-65% dark:to-neutral-900 transition-colors pointer-events-none animate-pulse"></div>
    </div>
  );
}
