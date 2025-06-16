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
  const vals = [100, 200, 300, 400];
  const c = colors[Math.floor(Math.random() * colors.length)];
  const v = vals[Math.floor(Math.random() * vals.length)];
  return `bg-${c}-${v}`;
}

const randomLocation = () => {
  const top = Math.floor(Math.random() * 40); // 0-79
  const left = Math.floor(Math.random() * 100);
  return [`top-${top}`, `left-${left}`];
};

const randomRotation = () => {
  const angle = Math.floor(Math.random() * 45); // 0–45
  const sign = Math.random() < 0.5 ? "" : "-";
  return `${sign}rotate-[${angle}deg]`;
};
// --------------------------------

export default function CommentSection() {
  const [notes, setNotes] = useState([]); // {id, comment, style, color}
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("prompt"); // "prompt" | "compose" | "display"

  // fetch comments once
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("comment")
        .select("*")
        .order("timestamp", { ascending: true });

      if (!error && data) {
        setNotes(
          data.map((row) => ({
            ...row,
            location: randomLocation(),
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
          location: randomLocation(),
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

  // ------------- UI -------------
  const Overlay = () => (
    <div className="absolute inset-0 backdrop-blur-md rounded-xl bg-black/10 flex items-center justify-center z-20 select-none">
      {mode === "prompt" && (
        <button
          onClick={() => setMode("compose")}
          className="text-lg md:text-xl font-medium bg-white/50 px-6 py-3 rounded-lg shadow hover:scale-110 duration-300 cursor-pointer"
        >
          Touch here to leave a message
        </button>
      )}

      {mode === "compose" && (
        <div className="flex items-center gap-2 bg-white/60 dark:bg-neutral-800/60 p-4 rounded-2xl z-30 shadow">
          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something…"
            className="px-3 py-1 outline-none w-auto"
          />

          <button
            onClick={postNote}
            disabled={busy}
            className="text-black dark:text-white size-5 disabled:opacity-50"
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
          className={[
            n.location[0],
            n.location[1],
            n.color, // bg-color
            n.rotation, // rotate-class
            "absolute px-3 py-2 rounded shadow-md whitespace-pre-wrap",
            "hover:scale-110 active:scale-90 duration-300 select-none",
          ].join(" ")}
        >
          {n.comment}
        </div>
      ))}

      {/* overlay (blur + prompt / compose) */}
      {mode !== "display" && <Overlay />}

      {/* bottom input row (after first post) */}
      {mode === "display" && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          className="absolute right-5 bottom-5 size-6 hover:scale-110 active:scale-90 duration-300"
          onClick={openCompose}
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
          />
        </svg>
      )}
    </div>
  );
}
