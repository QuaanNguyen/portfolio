import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "motion/react";
import HarmonicCanvas from "./HarmonicCanvas";
import PrototypeLogo from "./PrototypeLogo";
import useGuitarEngine from "./useGuitarEngine";
import { pathFromSample, SAMPLE_LINES, solveGesture, tonicName } from "./musicModel";

const SAVED_LINES_KEY = "quan-portfolio-soundlines";

function readSavedLines() {
  try {
    const value = window.localStorage.getItem(SAVED_LINES_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function PathButton({ active, item, onChoose }) {
  return (
    <Motion.button
      type="button"
      className={`path-button ${active ? "is-active" : ""}`}
      onClick={() => onChoose(item)}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="path-button-shape" aria-hidden="true">{item.closed ? "○" : "⌁"}</span>
      <span>
        <strong>{item.title}</strong>
        <small>{item.creator || item.artist}</small>
      </span>
    </Motion.button>
  );
}

function LibraryPanel({
  bpm,
  currentPath,
  onBpmChange,
  onChoose,
  onPlay,
  onSave,
  onStop,
  saved,
  transportState,
}) {
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [folderOpen, setFolderOpen] = useState(true);
  const [saveOpen, setSaveOpen] = useState(false);
  const canOpenSave = currentPath?.source === "gesture" && currentPath.events.length > 1;
  const canSave = currentPath?.source === "gesture" && currentPath.events.length > 1 && title.trim() && creator.trim();

  const submit = (event) => {
    event.preventDefault();
    if (!canSave) return;
    onSave(title.trim(), creator.trim());
    setTitle("");
    setCreator("");
    setSaveOpen(false);
  };

  return (
    <div className="library-panel">
      <div className="library-heading">
        <span>soundlines</span>
        <span className="library-live">saved locally</span>
      </div>
      <div className="library-transport">
        <button type="button" onClick={onPlay} disabled={!currentPath}>
          <span aria-hidden="true">{transportState === "idle" ? "▶" : "↻"}</span>
          <strong>{transportState === "idle" ? "play line" : "restart line"}</strong>
        </button>
        <button type="button" onClick={onStop} disabled={transportState === "idle"} aria-label="Stop playback">■</button>
      </div>
      <label className="library-tempo">
        <span>tempo</span>
        <input
          type="range"
          min="42"
          max="128"
          step="1"
          value={bpm}
          onChange={(event) => onBpmChange(Number(event.target.value))}
          aria-label="Playback tempo"
        />
        <strong>{bpm} bpm</strong>
      </label>
      <div className="sample-folder">
        <button
          type="button"
          className="folder-trigger"
          aria-expanded={folderOpen}
          onClick={() => setFolderOpen((open) => !open)}
        >
          <Motion.span animate={{ rotate: folderOpen ? 0 : -90 }}>⌄</Motion.span>
          samples
          <small>{SAMPLE_LINES.length}</small>
        </button>
        <AnimatePresence initial={false}>
          {folderOpen && (
            <Motion.div
              className="folder-items"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div>
                {SAMPLE_LINES.map((sample) => {
                  const item = pathFromSample(sample);
                  return (
                    <PathButton
                      key={sample.id}
                      item={item}
                      active={currentPath?.id === sample.id}
                      onChoose={onChoose}
                    />
                  );
                })}
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
      {currentPath?.source === "sample" && currentPath.note && (
        <p className="sample-caveat">
          {currentPath.note}
          {currentPath.sourceUrl && <a href={currentPath.sourceUrl} target="_blank" rel="noreferrer">chord reference ↗</a>}
        </p>
      )}
      <a
        className="library-audio-source"
        href="https://theremin.music.uiowa.edu/MIS.html"
        target="_blank"
        rel="noreferrer"
      >
        Raimundo acoustic recordings · University of Iowa ↗
      </a>
      <div className="root-list">
        <div className="root-label"><span>/</span><small>{saved.length} saved</small></div>
        {saved.length ? saved.map((item) => (
          <PathButton
            key={item.id}
            item={item}
            active={currentPath?.id === item.id}
            onChoose={onChoose}
          />
        )) : <p className="empty-library">Your named lines land here.</p>}
      </div>
      <div className="save-line-area">
        {canOpenSave && !saveOpen && (
          <Motion.button
            type="button"
            className="save-line-trigger"
            onClick={() => setSaveOpen(true)}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span>＋</span> save this line
          </Motion.button>
        )}
        <AnimatePresence initial={false}>
          {canOpenSave && saveOpen && (
            <Motion.form
              className="save-line-form"
              onSubmit={submit}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="save-line-heading">
                <strong>Save to /</strong>
                <button type="button" onClick={() => setSaveOpen(false)} aria-label="Close save form">×</button>
              </div>
              <label>
                line / chord name
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="desert cadence" required autoFocus />
              </label>
              <label>
                your name
                <input value={creator} onChange={(event) => setCreator(event.target.value)} placeholder="quan" required />
              </label>
              <button type="submit" disabled={!canSave}>save current line</button>
            </Motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProgressionReadout({ path, playheadIndex }) {
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (playheadIndex < 0) return;
    scrollerRef.current
      ?.querySelector(`[data-event-index="${playheadIndex}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [playheadIndex]);

  if (!path?.events?.length) {
    return (
      <div className="progression-readout is-empty">
        <span>gesture empty</span>
        <p>Press anywhere to lock a key, then draw.</p>
      </div>
    );
  }

  const sectionStarts = new Map((path.sections ?? []).map((section) => [section.startIndex, section.label]));

  return (
    <div className="progression-readout">
      <span>{path.closed ? "loop" : "open phrase"}</span>
      <div className="progression-chords" ref={scrollerRef}>
        {path.events.map((event, index) => (
          <span className="progression-event" key={`${index}-${event.chord.label}`}>
            {sectionStarts.has(index) && <small>{sectionStarts.get(index)}</small>}
            <Motion.b
              layout
              data-event-index={index}
              className={index === playheadIndex ? "is-playing" : ""}
            >
              {event.chord.label}
            </Motion.b>
          </span>
        ))}
      </div>
    </div>
  );
}

function StudioStatus({ audioReady, path, playheadIndex, sampleMode, transportState }) {
  const chord = playheadIndex >= 0 ? path?.events?.[playheadIndex]?.chord : path?.events?.at(-1)?.chord;

  return (
    <div className="studio-status" aria-live="polite">
      <span className="status-light" />
      <span>{audioReady ? sampleMode : "real guitar loads on first play"}</span>
      <strong>{chord?.label ?? "no chord"}</strong>
      <span>{transportState === "preparing" ? "loading recordings" : transportState}</span>
    </div>
  );
}

export default function ChordStudio({ variant, onBack }) {
  const [path, setPath] = useState(null);
  const [saved, setSaved] = useState(readSavedLines);
  const [bpm, setBpm] = useState(66);
  const [playheadIndex, setPlayheadIndex] = useState(-1);
  const [transportState, setTransportState] = useState("idle");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false);
  const [narrowViewport, setNarrowViewport] = useState(false);
  const { audioReady, playLogoSignature, playSequence, sampleMode, stopSequence } = useGuitarEngine();
  const accent = variant === "B" ? "#4cb05e" : variant === "C" ? "#0d7e70" : "#176bff";

  useEffect(() => {
    const query = window.matchMedia("(max-width: 980px)");
    const update = () => setNarrowViewport(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SAVED_LINES_KEY, JSON.stringify(saved));
    } catch {
      return;
    }
  }, [saved]);

  const choosePath = (nextPath) => {
    stopSequence();
    setTransportState("idle");
    setPath(nextPath);
    setPlayheadIndex(-1);
    setMobileLibraryOpen(false);
    if (narrowViewport) {
      window.requestAnimationFrame(() => document.querySelector(".harmonic-canvas")?.focus());
    }
  };

  const startPlayback = (nextPath) => {
    if (!nextPath?.events?.length) return;
    stopSequence();
    setPlayheadIndex(-1);
    playSequence(nextPath.events, setPlayheadIndex, {
      bpm,
      onState: setTransportState,
    });
  };

  const savePath = (title, creator) => {
    const savedPath = {
      ...path,
      id: `saved-${Date.now()}`,
      title,
      creator,
      source: "saved",
    };
    setSaved((items) => [...items, savedPath]);
    setPath(savedPath);
  };

  const replayPath = () => {
    if (!path?.events?.length) return;
    startPlayback(path);
  };

  const stopPlayback = () => {
    stopSequence();
    setPlayheadIndex(-1);
    setTransportState("idle");
  };

  const changeBpm = (nextBpm) => {
    stopPlayback();
    setBpm(nextBpm);
  };

  const polishPath = () => {
    if (!path?.events?.length || path.source !== "gesture") return;
    const points = path.events.map((event) => event.point);
    const chords = solveGesture(points, path.tonicPc, path.closed);
    const polishedPath = {
      ...path,
      events: points.map((point, index) => ({ point, chord: chords[index] })),
      polished: true,
    };
    stopSequence();
    setPath(polishedPath);
    setPlayheadIndex(-1);
    startPlayback(polishedPath);
  };

  const currentState = useMemo(() => ({
    variant,
    surface: "sound canvas",
    source: path?.source ?? "empty",
    tonic: path ? tonicName(path.tonicPc) : null,
    events: path?.events?.length ?? 0,
    loop: path?.closed ?? false,
    polished: path?.polished ?? false,
    bpm,
    transport: transportState,
    saved: saved.length,
  }), [bpm, path, saved.length, transportState, variant]);

  const canvas = (
    <HarmonicCanvas
      accent={accent}
      bpm={bpm}
      path={path}
      playheadIndex={playheadIndex}
      onBpmChange={changeBpm}
      onGestureComplete={startPlayback}
      onPolish={polishPath}
      onPathChange={(nextPath) => {
        stopSequence();
        setTransportState("idle");
        setPlayheadIndex(-1);
        setPath(nextPath);
      }}
    />
  );

  const library = (
    <LibraryPanel
      bpm={bpm}
      currentPath={path}
      onBpmChange={changeBpm}
      onChoose={choosePath}
      onPlay={replayPath}
      onSave={savePath}
      onStop={stopPlayback}
      saved={saved}
      transportState={transportState}
    />
  );

  const sharedHeader = (
    <>
      <button type="button" className="studio-back" onClick={onBack}>← home</button>
      <PrototypeLogo compact tone={variant === "C" ? "ink" : variant === "B" ? "green" : "blue"} onReplay={playLogoSignature} />
      <div className="studio-title">
        <span>experiment 01</span>
        <strong>harmonic field</strong>
      </div>
      <button
        type="button"
        className="mobile-library-toggle"
        onClick={() => setMobileLibraryOpen((open) => !open)}
        aria-label="Open soundlines library"
        aria-expanded={mobileLibraryOpen}
      >
        library <small>{saved.length}</small>
      </button>
    </>
  );

  return (
    <AnimatePresence mode="sync">
      {variant === "A" && (
        <Motion.section
          key="studio-a"
          className="chord-studio studio-a"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <header className="studio-a-header">
            {sharedHeader}
            <StudioStatus audioReady={audioReady} path={path} playheadIndex={playheadIndex} sampleMode={sampleMode} transportState={transportState} />
          </header>
          <div className="studio-a-body">
            <AnimatePresence>
              {mobileLibraryOpen && (
                <Motion.button
                  type="button"
                  className="mobile-library-backdrop"
                  aria-label="Close soundlines library"
                  onClick={() => setMobileLibraryOpen(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>
            <Motion.aside
              className={`studio-sidebar ${sidebarOpen ? "is-open" : "is-collapsed"} ${mobileLibraryOpen ? "is-mobile-open" : ""}`}
              aria-hidden={narrowViewport && !mobileLibraryOpen}
              inert={narrowViewport && !mobileLibraryOpen}
              initial={false}
              animate={{ width: sidebarOpen ? 268 : 64 }}
              transition={{ type: "spring", stiffness: 330, damping: 34, mass: 0.82 }}
            >
              <button
                type="button"
                className="mobile-library-close"
                onClick={() => setMobileLibraryOpen(false)}
                aria-label="Close soundlines library"
              >
                ×
              </button>
              <button
                type="button"
                className="sidebar-collapse"
                onClick={() => setSidebarOpen((open) => !open)}
                aria-label={sidebarOpen ? "Collapse library" : "Open library"}
                aria-expanded={sidebarOpen}
              >
                <Motion.span animate={{ rotate: sidebarOpen ? 0 : 180 }}>‹</Motion.span>
              </button>
              <Motion.div
                className="sidebar-expanded"
                animate={{ opacity: sidebarOpen ? 1 : 0, x: sidebarOpen ? 0 : -8 }}
                transition={{ duration: 0.16 }}
                aria-hidden={!sidebarOpen}
                style={{ pointerEvents: sidebarOpen ? "auto" : "none" }}
              >
                {library}
              </Motion.div>
              <AnimatePresence>
                {!sidebarOpen && (
                  <Motion.div
                    className="sidebar-rail"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <button type="button" title="Open samples" onClick={() => setSidebarOpen(true)}>♫</button>
                    <button type="button" title="Open saved lines" onClick={() => setSidebarOpen(true)}>⌁<small>{saved.length}</small></button>
                  </Motion.div>
                )}
              </AnimatePresence>
            </Motion.aside>
            <main>
              <div className="canvas-intro">
                <div><span>01</span><strong>Draw a feeling through harmony.</strong></div>
                <p>Left shifts minor to major. Height adds color. Release the line to hear it at your tempo.</p>
              </div>
              {canvas}
              <ProgressionReadout path={path} playheadIndex={playheadIndex} />
            </main>
          </div>
          <output className="prototype-state">{JSON.stringify(currentState)}</output>
        </Motion.section>
      )}

      {variant === "B" && (
        <Motion.section
          key="studio-b"
          className="chord-studio studio-b"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <header className="studio-b-header">
            {sharedHeader}
            <StudioStatus audioReady={audioReady} path={path} playheadIndex={playheadIndex} sampleMode={sampleMode} transportState={transportState} />
          </header>
          <main className="studio-b-stage">
            <Motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              {library}
            </Motion.aside>
            <div className="studio-b-canvas">
              {canvas}
              <ProgressionReadout path={path} playheadIndex={playheadIndex} />
            </div>
            <div className="studio-b-note">
              <span>how to play</span>
              <p>Draw in silence, then release. Tempo is fixed by BPM, so your hand can move freely.</p>
            </div>
          </main>
          <output className="prototype-state">{JSON.stringify(currentState)}</output>
        </Motion.section>
      )}

      {variant === "C" && (
        <Motion.section
          key="studio-c"
          className="chord-studio studio-c"
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
        >
          <header className="studio-c-header">
            {sharedHeader}
            <ProgressionReadout path={path} playheadIndex={playheadIndex} />
          </header>
          <main className={`studio-c-body ${sidebarOpen ? "is-sidebar-open" : "is-sidebar-collapsed"}`}>
            <div className="studio-c-canvas">{canvas}</div>
            <aside>
              <button
                type="button"
                className="c-sidebar-collapse"
                onClick={() => setSidebarOpen((open) => !open)}
                aria-label={sidebarOpen ? "Collapse library" : "Open library"}
                aria-expanded={sidebarOpen}
              >
                <Motion.span animate={{ rotate: sidebarOpen ? 0 : 180 }}>‹</Motion.span>
              </button>
              <Motion.div
                className="c-sidebar-content"
                animate={{ opacity: sidebarOpen || narrowViewport ? 1 : 0, x: sidebarOpen || narrowViewport ? 0 : -8 }}
                transition={{ duration: 0.18 }}
                aria-hidden={!sidebarOpen && !narrowViewport}
                style={{ pointerEvents: sidebarOpen || narrowViewport ? "auto" : "none" }}
              >
                <StudioStatus audioReady={audioReady} path={path} playheadIndex={playheadIndex} sampleMode={sampleMode} transportState={transportState} />
                <div className="c-inspector-copy">
                  <span>tonnetz input field</span>
                  <p>Every tile locks a repeatable tonic. Draw silently, release to play, then tune the pace without redrawing.</p>
                </div>
                {library}
              </Motion.div>
              {!sidebarOpen && !narrowViewport && (
                <Motion.div className="c-sidebar-rail" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <button type="button" title="Open samples" onClick={() => setSidebarOpen(true)}>♫</button>
                  <button type="button" title="Open saved lines" onClick={() => setSidebarOpen(true)}>⌁<small>{saved.length}</small></button>
                </Motion.div>
              )}
            </aside>
          </main>
          <output className="prototype-state">{JSON.stringify(currentState)}</output>
        </Motion.section>
      )}
    </AnimatePresence>
  );
}
