export function getIdentityPreviewOffsets(count, activeIndex) {
  return Array.from({ length: count }, (_, index) => (index - activeIndex) * 100);
}
