import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "motion/react";
import { selectSadEmoji } from "./playgroundEmojiCatalog";
import {
  addEmojiBody,
  createPlaygroundPhysics,
  destroyPlaygroundPhysics,
  getEmojiTransforms,
  getPlaygroundEmojiDiameter,
  hasMovingEmojiBodies,
  resizePlaygroundPhysics,
  stepPlaygroundPhysics,
} from "./playgroundPhysics";

const LABEL = "// coming soon";

export default function PlaygroundUnderConstruction() {
  const [isRevealed, setIsRevealed] = useState(false);
  const [emojis, setEmojis] = useState([]);
  const [announcement, setAnnouncement] = useState("");
  const sectionRef = useRef(null);
  const emojiElementsRef = useRef(new Map());
  const physicsRef = useRef(null);
  const startPhysicsRef = useRef(() => undefined);
  const recentEmojiIdsRef = useRef([]);
  const nextEmojiIdRef = useRef(0);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const initialBounds = section.getBoundingClientRect();
    const physics = createPlaygroundPhysics(initialBounds.width, initialBounds.height);
    let animationFrame = null;
    let previousTimestamp = null;
    physicsRef.current = physics;

    const render = () => {
      getEmojiTransforms(physics).forEach((emoji) => {
        const element = emojiElementsRef.current.get(emoji.id);
        if (!element) return;
        element.style.transform = `translate3d(${emoji.x}px, ${emoji.y}px, 0) rotate(${emoji.angle}rad)`;
      });
    };

    const tick = (timestamp) => {
      const elapsed = previousTimestamp === null
        ? 1000 / 60
        : timestamp - previousTimestamp;
      previousTimestamp = timestamp;
      stepPlaygroundPhysics(physics, elapsed);
      render();

      if (hasMovingEmojiBodies(physics)) {
        animationFrame = window.requestAnimationFrame(tick);
      } else {
        animationFrame = null;
        previousTimestamp = null;
      }
    };

    const startPhysics = () => {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(tick);
    };

    const resize = () => {
      const bounds = section.getBoundingClientRect();
      resizePlaygroundPhysics(physics, bounds.width, bounds.height);
      render();
      startPhysics();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(section);
    startPhysicsRef.current = startPhysics;

    return () => {
      resizeObserver.disconnect();
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      destroyPlaygroundPhysics(physics);
      physicsRef.current = null;
      startPhysicsRef.current = () => undefined;
    };
  }, []);

  const handleClick = () => {
    if (!isRevealed) {
      setIsRevealed(true);
      setAnnouncement("Playground coming soon.");
      return;
    }

    const emoji = selectSadEmoji(recentEmojiIdsRef.current);
    recentEmojiIdsRef.current = [...recentEmojiIdsRef.current, emoji.id].slice(-4);
    const instanceId = `${emoji.id}-${nextEmojiIdRef.current}`;
    nextEmojiIdRef.current += 1;
    const bounds = sectionRef.current.getBoundingClientRect();
    const diameter = getPlaygroundEmojiDiameter(bounds.width, bounds.height);
    const droppedEmoji = { ...emoji, diameter, instanceId };

    setEmojis((current) => [...current, droppedEmoji]);
    addEmojiBody(physicsRef.current, { diameter, id: instanceId });
    startPhysicsRef.current();
    setAnnouncement(`${emoji.label} dropped. ${emojis.length + 1} emojis in the playground.`);
  };

  return (
    <section
      className="playground-section"
      aria-labelledby="playground-title"
      ref={sectionRef}
    >
      <div className="playground-emoji-world" aria-hidden="true">
        {emojis.map((emoji) => (
          <span
            className="playground-emoji"
            key={emoji.instanceId}
            ref={(element) => {
              if (element) emojiElementsRef.current.set(emoji.instanceId, element);
              else emojiElementsRef.current.delete(emoji.instanceId);
            }}
            style={{
              "--emoji-size": `${emoji.diameter}px`,
            }}
          >
            {emoji.glyph}
          </span>
        ))}
      </div>
      <h2 id="playground-title">playground</h2>
      <AnimatePresence>
        {isRevealed && (
          <Motion.span
            className="playground-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.32 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            {LABEL}
          </Motion.span>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={handleClick}
        aria-label={isRevealed ? "Drop a sad emoji into the playground" : "Reveal playground status"}
      >
        enter site
        <span aria-hidden="true">↗</span>
      </button>
      <span className="playground-accessible-label" aria-live="polite">
        {announcement}
      </span>
    </section>
  );
}
