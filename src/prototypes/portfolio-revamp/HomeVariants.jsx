import { useState } from "react";
import { AnimatePresence, motion as Motion } from "motion/react";
import DitherCanvas from "./DitherCanvas";
import PrototypeLogo from "./PrototypeLogo";
import tularosaImage from "./assets/tularosa-basin-2025.jpg";

const COMPANIES = [
  "John Hancock",
  "ASU Next Lab",
  "Arizona State University",
  "Maricopa County Attorney's Office",
  "Crown Castle",
  "ASU Cloud Innovation Center",
];

const PROJECTS = [
  {
    name: "q.it",
    href: "https://github.com/QuaanNguyen/q.it",
    description: "Local catalog and capacity planner for open-weight models.",
  },
  {
    name: "Fill",
    href: "https://github.com/QuaanNguyen/Fill",
    description: "Autofill loan estimates.",
  },
  {
    name: "UChain",
    href: "https://github.com/QuaanNguyen/UChain",
    description: "Hybrid university records with fast queries and blockchain verification.",
  },
  {
    name: "ML-Guide",
    href: "https://github.com/QuaanNguyen/ML-Guide",
    description: "Deep learning and classical vision for chest X-ray analysis.",
  },
];

const cItem = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function HomeVariants({ onOpenStudio, onReplayLogo, onReverseLogo, onStopLogo }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Motion.main
      className={`prototype-home home-c ${revealed ? "is-revealed" : "is-gated"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "relative",
        display: "block",
        overflowX: "hidden",
        overflowY: revealed ? "auto" : "hidden",
        padding: 0,
        background: "#f1f0ef",
        color: "#1d1d1d",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "clamp(30px, 6vh, 58px)",
          left: "clamp(18px, 4vw, 58px)",
          zIndex: 12,
        }}
      >
        <PrototypeLogo
          tone="blue"
          size="hero"
          onReplay={onReplayLogo}
          onReverse={onReverseLogo}
          onStop={onStopLogo}
          onResolve={() => setRevealed(true)}
        />
        <AnimatePresence>
          {!revealed && (
            <Motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: [0.42, 0.86, 0.42], y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              transition={{ opacity: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }, y: { duration: 0.45 } }}
              style={{
                position: "absolute",
                top: "100%",
                left: 2,
                marginTop: 12,
                color: "#6b7280",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              hold the mark to unfold
            </Motion.p>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {revealed && (
          <Motion.div
            key="revealed-portfolio"
            initial={{ clipPath: "circle(0% at 8% 10%)" }}
            animate={{ clipPath: "circle(180% at 8% 10%)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "relative",
              minHeight: "100%",
              zIndex: 2,
              background: "#f2f4ee",
              color: "#15211b",
            }}
          >
            {[0, 1, 2].map((wave) => (
              <Motion.span
                key={wave}
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: [0, 0.34, 0], scale: 5.8 }}
                transition={{ duration: 1.5, delay: wave * 0.14, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: "absolute",
                  top: 48,
                  left: 35,
                  width: 116,
                  height: 116,
                  border: "1px solid rgba(57, 118, 217, 0.42)",
                  borderRadius: "50%",
                  pointerEvents: "none",
                  transformOrigin: "center",
                }}
              />
            ))}

            <div style={{ minHeight: "clamp(210px, 29vh, 278px)" }} />

            <Motion.div
              variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.32 } } }}
              initial="hidden"
              animate="show"
              style={{
                width: "min(100%, 1440px)",
                margin: "0 auto",
                padding: "0 clamp(18px, 5vw, 76px) 88px",
              }}
            >
              <Motion.section
                variants={cItem}
                aria-labelledby="c-intro-title"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 310px), 1fr))",
                  gap: "clamp(26px, 5vw, 74px)",
                  alignItems: "end",
                  padding: "clamp(34px, 6vw, 86px) 0",
                  borderTop: "1px solid rgba(21, 33, 27, 0.18)",
                }}
              >
                <div>
                  <span style={{ color: "#3976d9", fontSize: 11, fontWeight: 800, letterSpacing: "0.13em", textTransform: "uppercase" }}>
                    software engineer · builder · guitarist
                  </span>
                  <h1
                    id="c-intro-title"
                    style={{
                      maxWidth: 780,
                      margin: "22px 0 0",
                      color: "#15211b",
                      fontSize: "clamp(54px, 8vw, 126px)",
                      fontWeight: 520,
                      letterSpacing: "-0.07em",
                      lineHeight: 0.86,
                    }}
                  >
                    Quan <span style={{ color: "#3976d9" }}>Nguyen</span>
                  </h1>
                  <p style={{ maxWidth: 650, margin: "30px 0 0", color: "#536159", fontSize: "clamp(16px, 1.5vw, 21px)", lineHeight: 1.55 }}>
                    I turn repetitive work into useful systems, then use motion and sound to make those systems feel understandable.
                  </p>
                </div>

                <figure style={{ position: "relative", minHeight: "clamp(290px, 44vw, 540px)", margin: 0, overflow: "hidden", borderRadius: "6px 72px 6px 6px", background: "#dce7de" }}>
                  <DitherCanvas src={tularosaImage} mode="glyphfield" />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 54%, rgba(11, 31, 24, 0.42))" }} />
                  <figcaption style={{ position: "absolute", right: 18, bottom: 16, left: 18, display: "flex", justifyContent: "space-between", gap: 20, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.72)", color: "#fff", fontSize: 10, fontWeight: 750, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    <span>origin · tularosa basin, nm · '25</span>
                    <span>light as texture</span>
                  </figcaption>
                </figure>
              </Motion.section>

              <Motion.section variants={cItem} aria-labelledby="c-companies-title" style={{ padding: "clamp(36px, 6vw, 76px) 0", borderTop: "1px solid rgba(21, 33, 27, 0.18)" }}>
                <h2 id="c-companies-title" style={{ margin: "0 0 28px", color: "#647169", fontSize: 11, fontWeight: 800, letterSpacing: "0.13em", textTransform: "uppercase" }}>
                  places I have built with
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 28px" }}>
                  {COMPANIES.map((company, index) => (
                    <span key={company} style={{ color: "#1b2922", fontSize: "clamp(18px, 2.2vw, 34px)", fontWeight: 540, letterSpacing: "-0.035em" }}>
                      {company}{index < COMPANIES.length - 1 ? " ·" : ""}
                    </span>
                  ))}
                </div>
              </Motion.section>

              <Motion.section variants={cItem} aria-labelledby="c-projects-title" style={{ padding: "clamp(38px, 7vw, 90px) 0", borderTop: "1px solid rgba(21, 33, 27, 0.18)" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 18, marginBottom: 30 }}>
                  <h2 id="c-projects-title" style={{ margin: 0, color: "#15211b", fontSize: "clamp(34px, 5vw, 68px)", fontWeight: 520, letterSpacing: "-0.055em" }}>
                    open folders
                  </h2>
                  <a href="https://github.com/QuaanNguyen" target="_blank" rel="noreferrer" style={{ color: "#3976d9", fontSize: 11, fontWeight: 800, textDecoration: "none", textTransform: "uppercase" }}>
                    github ↗
                  </a>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 255px), 1fr))", borderTop: "1px solid #233129", borderLeft: "1px solid #233129" }}>
                  {PROJECTS.map((project, index) => (
                    <Motion.a
                      key={project.name}
                      href={project.href}
                      target="_blank"
                      rel="noreferrer"
                      whileHover={{ y: -5, backgroundColor: "#e7eee4" }}
                      style={{ minHeight: 220, padding: "22px", borderRight: "1px solid #233129", borderBottom: "1px solid #233129", color: "#15211b", textDecoration: "none" }}
                    >
                      <span style={{ display: "block", marginBottom: 38, color: "#728078", fontSize: 9, fontWeight: 800, letterSpacing: "0.11em", textTransform: "uppercase" }}>
                        github / {String(index + 1).padStart(2, "0")}
                      </span>
                      <strong style={{ display: "block", marginBottom: 13, fontSize: "clamp(26px, 3vw, 42px)", fontWeight: 530, letterSpacing: "-0.05em" }}>
                        {project.name} ↗
                      </strong>
                      <span style={{ display: "block", maxWidth: 310, color: "#5a675f", fontSize: 14, lineHeight: 1.5 }}>
                        {project.description}
                      </span>
                    </Motion.a>
                  ))}
                </div>
              </Motion.section>

              <Motion.section variants={cItem} style={{ padding: "clamp(18px, 4vw, 48px) 0 clamp(50px, 8vw, 100px)" }}>
                <Motion.button
                  type="button"
                  onClick={onOpenStudio}
                  whileHover={{ scale: 0.992 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: "100%",
                    minHeight: "clamp(210px, 32vw, 410px)",
                    padding: "clamp(26px, 5vw, 70px)",
                    border: 0,
                    borderRadius: "8px 90px 8px 8px",
                    background: "#3976d9",
                    color: "#fff",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ display: "block", marginBottom: 34, fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    interactive experiment 01
                  </span>
                  <strong style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, fontSize: "clamp(43px, 7vw, 108px)", fontWeight: 520, letterSpacing: "-0.065em", lineHeight: 0.88 }}>
                    <span>draw a line.<br />hear the harmony.</span>
                    <span aria-hidden="true">↗</span>
                  </strong>
                </Motion.button>
              </Motion.section>

              <Motion.footer variants={cItem} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 30, padding: "42px 0 20px", borderTop: "1px solid #233129" }}>
                <div>
                  <h2 style={{ margin: 0, color: "#15211b", fontSize: "clamp(38px, 5vw, 72px)", fontWeight: 520, letterSpacing: "-0.06em" }}>
                    find me
                  </h2>
                  <p style={{ margin: "12px 0 0", color: "#66736b", fontSize: 12 }}>Phoenix, Arizona · open to useful problems</p>
                </div>
                <nav aria-label="Contact links" style={{ display: "grid", alignContent: "start", gap: 12 }}>
                  <a href="mailto:quannguyenanhnaq@gmail.com" style={{ color: "#15211b", fontSize: "clamp(16px, 2vw, 25px)", textDecorationColor: "#3976d9", textUnderlineOffset: 5 }}>quannguyenanhnaq@gmail.com</a>
                  <a href="https://github.com/QuaanNguyen" target="_blank" rel="noreferrer" style={{ color: "#15211b", fontSize: "clamp(16px, 2vw, 25px)", textUnderlineOffset: 5 }}>GitHub ↗</a>
                  <a href="https://www.linkedin.com/in/quan-nguyen-127650221/" target="_blank" rel="noreferrer" style={{ color: "#15211b", fontSize: "clamp(16px, 2vw, 25px)", textUnderlineOffset: 5 }}>LinkedIn ↗</a>
                </nav>
              </Motion.footer>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.main>
  );
}
