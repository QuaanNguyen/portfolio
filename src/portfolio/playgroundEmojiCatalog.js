export const SAD_EMOJI_CATALOG = Object.freeze({
  pensive: Object.freeze({ id: "pensive", glyph: "😔", label: "Pensive face" }),
  disappointed: Object.freeze({ id: "disappointed", glyph: "😞", label: "Disappointed face" }),
  worried: Object.freeze({ id: "worried", glyph: "😟", label: "Worried face" }),
  frowning: Object.freeze({ id: "frowning", glyph: "☹️", label: "Frowning face" }),
  crying: Object.freeze({ id: "crying", glyph: "😢", label: "Crying face" }),
  loudlyCrying: Object.freeze({ id: "loudly-crying", glyph: "😭", label: "Loudly crying face" }),
  weary: Object.freeze({ id: "weary", glyph: "😩", label: "Weary face" }),
  pleading: Object.freeze({ id: "pleading", glyph: "🥺", label: "Pleading face" }),
  sadButRelieved: Object.freeze({ id: "sad-but-relieved", glyph: "😥", label: "Sad but relieved face" }),
  downcast: Object.freeze({ id: "downcast", glyph: "😓", label: "Downcast face with sweat" }),
  confounded: Object.freeze({ id: "confounded", glyph: "😖", label: "Confounded face" }),
  anxious: Object.freeze({ id: "anxious", glyph: "😰", label: "Anxious face with sweat" }),
});

const REPEAT_GAP = 4;

export function selectSadEmoji(recentIds, random = Math.random) {
  const blockedIds = new Set(recentIds.slice(-REPEAT_GAP));
  const candidates = Object.values(SAD_EMOJI_CATALOG)
    .filter((emoji) => !blockedIds.has(emoji.id));
  const randomValue = Math.min(0.999999, Math.max(0, random()));
  return candidates[Math.floor(randomValue * candidates.length)];
}
