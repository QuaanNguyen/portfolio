import { useEffect, useState } from "react";
import supabase from "../lib/supabase";

// ---------- helpers ----------
function getRandomBg() {
  const colors = [
    "slate",
    "gray",
    "zinc",
    "neutral",
    "stone",
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
  ];
  const vals = [50, 100, 200, 300, 400, 500, 600];
  const c = colors[Math.floor(Math.random() * colors.length)];
  const v = vals[Math.floor(Math.random() * vals.length)];
  // If background is bright (v <= 400), force black text in dark mode to keep it readable.
  const themeFix = v <= 400 ? "dark:text-black" : "";
  return `bg-${c}-${v} ${themeFix}`;
}

const randomRotation = () => {
  const angle = Math.floor(Math.random() * 45); // 0–45
  const sign = Math.random() < 0.5 ? "" : "-";
  return `${sign}rotate-[${angle}deg]`;
};

// Grid-based positioning helper
// Generates n random positions on a grid to minimize overlap
// Grid: 4 columns x 5 rows = 20 slots (adjust as needed)
const generateGridPositions = (count) => {
  const cols = 4;
  const rows = 5;
  const slots = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slots.push({ r, c });
    }
  }

  // Shuffle slots
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  const positions = [];
  for (let i = 0; i < count; i++) {
    const slot = slots[i % slots.length]; // Cycle if count > slots

    // Base position (percentage)
    const baseLeft = (slot.c / cols) * 100;
    const baseTop = (slot.r / rows) * 100;

    // Add random jitter within the cell (keep inside cell mostly)
    // Cell width approx 25%, Height approx 20%
    // Jitter: 0-15% for left, 0-10% for top to stay safe
    const jitterLeft = Math.random() * 15;
    const jitterTop = Math.random() * 10;

    positions.push({
      left: `${baseLeft + jitterLeft}%`,
      top: `${baseTop + jitterTop}%`,
    });
  }

  return positions;
};

// Get a single random position (for new notes)
const getSinglePosition = () => {
  const pos = generateGridPositions(1)[0];
  return pos;
};

// --------------------------------

export default function CommentSection() {
  const [notes, setNotes] = useState([]); // {id, comment, ...}
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("display"); // "display" | "compose"

  // fetch comments once
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("comment")
        .select("*")
        .order("timestamp", { ascending: true });

      if (!error && data) {
        // Generate positions for all loaded notes
        const positions = generateGridPositions(data.length);

        setNotes(
          data.map((row, i) => ({
            ...row,
            style: positions[i], // {top, left}
            color: getRandomBg(),
            rotation: randomRotation(),
          }))
        );
      }
    })();
  }, []);

  // post a new note
  const postNote = async () => {
    if (!input.trim()) return;
    setBusy(true);

    const { data, error } = await supabase
      .from("comment")
      .insert([{ comment: input.trim(), timestamp: new Date().toISOString() }])
      .select()
      .single();

    if (!error && data) {
      setNotes((prev) => [
        ...prev,
        {
          ...data,
          style: getSinglePosition(),
          color: getRandomBg(),
          rotation: randomRotation(),
        },
      ]);
      setInput("");
      setMode("display"); // remove blur + overlay
    } else {
      console.error(error?.message);
    }
    setBusy(false);
  };

  const openCompose = () => setMode("compose");
  const closeCompose = () => setMode("display");

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      postNote();
    }
  };

  // ------------- UI -------------
  const Overlay = () => (
    <div className="absolute inset-0 backdrop-blur-md rounded-xl bg-black/10 flex items-center justify-center z-20 select-none">
      {mode === "compose" && (
        <div className="relative flex items-center gap-2 bg-white/60 dark:bg-neutral-800/60 p-4 rounded-2xl z-30 shadow">
          {/* Cancel Button */}
          <button
            onClick={closeCompose}
            className="absolute -top-3 -left-3 bg-white dark:bg-neutral-700 rounded-full p-1 shadow hover:scale-110 active:scale-90 duration-300 text-red-500"
            title="Cancel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say something…"
            className="px-3 py-1 outline-none w-auto bg-transparent border-b border-gray-500/50"
          />

          <button
            onClick={postNote}
            disabled={busy}
            className="text-black dark:text-white size-5 disabled:opacity-50 hover:scale-110 active:scale-90 duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* floating notes */}
      {notes.map((n) => (
        <div
          key={n.id}
          style={n.style} // Apply inline top/left
          className={[
            n.color, // bg-color
            n.rotation, // rotate-class
            "absolute px-3 py-2 rounded shadow-md whitespace-pre-wrap max-w-[150px] lg:max-w-[200px] break-words", // Added max-w for safety
            "hover:scale-110 active:scale-90 duration-300 select-none z-10 hover:z-50 transition-all",
          ].join(" ")}
        >
          {n.comment}
        </div>
      ))}

      {/* overlay (blur + compose) */}
      {mode === "compose" && <Overlay />}

      {/* top right add button */}
      {mode === "display" && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="absolute right-5 top-5 size-6 hover:scale-110 active:scale-90 duration-300 cursor-pointer z-20 text-black dark:text-white"
          onClick={openCompose}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
          />
        </svg>
      )}
    </div>
  );
}
