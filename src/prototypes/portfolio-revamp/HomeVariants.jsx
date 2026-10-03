import { lazy, Suspense, useCallback, useState } from "react";
import { AnimatePresence, motion as Motion } from "motion/react";
import IdentityHoverList from "./IdentityHoverList";
import PortfolioLoader from "./PortfolioLoader";
import PrototypeLogo from "./PrototypeLogo";
import engineerImage from "./assets/identity/engineer.webp";
import overlanderImage from "./assets/identity/overlander.webp";
import chomperImage from "./assets/identity/chomper.webp";
import foodieImage from "./assets/identity/foodie.webp";
import asuLogo from "./assets/organizations/asu.png";
import awsLogo from "./assets/organizations/aws.svg";
import crownCastleLogo from "./assets/organizations/crown-castle.svg";
import johnHancockLogo from "./assets/organizations/john-hancock.svg";
import mcaoLogo from "./assets/organizations/mcao.webp";

const PlaygroundUnderConstruction = lazy(() => import("./PlaygroundUnderConstruction"));

const IDENTITIES = [
  { label: "engineer", image: engineerImage, alt: "A laptop open in the ASU Next Lab" },
  { label: "overlander", image: overlanderImage, alt: "Quan at a mountain overlook at sunrise" },
  { label: "chomper", image: chomperImage, alt: "Quan playing guitar beside a lake at sunset" },
  { label: "foodie", image: foodieImage, alt: "A large pizza sampler shared around a table" },
];

const EDUCATION = [
  {
    id: "bachelors",
    degree: "Computer Science, BS",
    school: "Arizona State University",
    detail: "Alongside a 3.84 GPA and two hackathon wins, I served as president of VinASU. In that role, I welcomed Vietnam’s ambassador and technology leaders to ASU, helping create space for stronger relationships and new ideas among the next generation of engineers.",
    source: "https://news.asu.edu/b/20250804-commemorating-30-years-usvietnam-relations",
  },
  {
    id: "masters",
    degree: "Computer Engineering, MS",
    school: "Arizona State University",
    detail: "Won another 3x hackathons and pushing toward the frontier of AI, and somehow found myself equally drawn to scaling cloud infrastructure and serving local inference with small language models; sounds bipolar, yet I believe they are two sides of the same coin.",
  },
];

const EXPERIENCES = [
  { id: "john-hancock-swe", company: "John Hancock", role: "Software Engineer", logo: johnHancockLogo, detail: "Incoming GRO 2027." },
  { id: "asu-it", company: "Arizona State University", role: "Member of Information Technology", logo: asuLogo, detail: "Supporting technology operations and digital experiences across Arizona State University." },
  { id: "john-hancock-intern", company: "John Hancock", role: "Software Engineer Intern", logo: johnHancockLogo, detail: "Built and shipped software in a large financial-services environment." },
  { id: "mcao", company: "Maricopa County Attorney’s Office", role: "Software Engineer Intern", logo: mcaoLogo, detail: "Built internal tools for public-sector teams and the people they serve." },
  { id: "aws", company: "Amazon Web Services", role: "Cloud Developer", logo: awsLogo, detail: "Developed cloud-native solutions through the ASU Cloud Innovation Center." },
  { id: "crown-castle", company: "Crown Castle", role: "Technology Intern", logo: crownCastleLogo, detail: "Worked on technology systems supporting nationwide communications infrastructure." },
];

const PROJECTS = [
  { name: "border-collie", eyebrow: "coding agent guard + desktop pet", href: "https://github.com/QuaanNguyen/border-collie" },
  { name: "q.it", eyebrow: "local model catalog + runtime", href: "https://github.com/QuaanNguyen/q.it" },
  { name: "smart ontology", eyebrow: "ontology schema + graph retrieval", href: "https://github.com/QuaanNguyen/disml-fall26" },
];

const HOME_ASSETS = [...new Set([
  ...IDENTITIES.map((identity) => identity.image),
  ...EXPERIENCES.map((experience) => experience.logo),
])];

export default function HomeVariants({ intro = "showcase", onPrepareLogo, onPlayLogo }) {
  const showcaseIntro = intro === "showcase";
  const [introStarted, setIntroStarted] = useState(!showcaseIntro);
  const [revealed, setRevealed] = useState(!showcaseIntro);
  const [openEducation, setOpenEducation] = useState("bachelors");
  const [activeExperience, setActiveExperience] = useState("john-hancock-swe");

  const toggleEducation = (id) => {
    setOpenEducation((current) => current === id ? null : id);
  };
  const finishLoading = useCallback(() => setIntroStarted(true), []);

  return (
    <Motion.main
      className={`prototype-home portfolio-home ${revealed ? "is-revealed" : "is-gated"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <AnimatePresence>
        {showcaseIntro && !introStarted && (
          <PortfolioLoader
            assets={HOME_ASSETS}
            onComplete={finishLoading}
            prepareSound={onPrepareLogo}
          />
        )}
      </AnimatePresence>

      <div className="portfolio-logo-anchor">
        <PrototypeLogo
          tone="blue"
          size="hero"
          autoPlay={introStarted}
          onPlay={onPlayLogo}
          onResolve={() => setRevealed(true)}
        />
      </div>

      <AnimatePresence>
        {revealed && (
          <Motion.div
            className="portfolio-reveal"
            initial={{ clipPath: "circle(0% at 7% 8%)" }}
            animate={{ clipPath: "circle(180% at 7% 8%)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
          >
            <aside className="portfolio-identity-panel">
              <section className="whoami-section" aria-labelledby="whoami-title">
                <h1 id="whoami-title">&quot;whoami&quot;</h1>
                <IdentityHoverList identities={IDENTITIES} />
              </section>

              <footer className="identity-footer">
                <p className="find-me-title">find me</p>
                <div className="identity-contact-grid">
                  <nav aria-label="Social links">
                    <a href="https://github.com/QuaanNguyen" target="_blank" rel="noreferrer">github ↗</a>
                    <a href="https://www.linkedin.com/in/quan-a-nguyen/" target="_blank" rel="noreferrer">linkedin ↗</a>
                  </nav>
                  <div className="identity-direct-contact">
                    <span>quannguyenanhnaq@gmail.com</span>
                    <span>+1 480-862-4827</span>
                  </div>
                </div>
              </footer>
            </aside>

            <div className="portfolio-content-panel">
              <div className="portfolio-sections-stack">
                <section className="portfolio-section education-section" aria-labelledby="education-title">
                  <header className="section-heading">
                    <h2 id="education-title">education</h2>
                    <p>I study, I mentor, I teach, I research; with love</p>
                  </header>

                  <div className="education-list">
                    {EDUCATION.map((item) => {
                      const isOpen = openEducation === item.id;
                      return (
                        <article className={`education-row ${isOpen ? "is-open" : ""}`} key={item.id}>
                          <button type="button" aria-expanded={isOpen} onClick={() => toggleEducation(item.id)}>
                            <span className="education-summary">
                              <strong>{item.degree}</strong>
                              <small>{item.school}</small>
                            </span>
                            <span className="expand-mark" aria-hidden="true">{isOpen ? "" : "+"}</span>
                          </button>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <Motion.div
                                className="education-detail"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                              >
                                <p>{item.detail}</p>
                                {item.source && <a href={item.source} target="_blank" rel="noreferrer">ASU story ↗</a>}
                              </Motion.div>
                            )}
                          </AnimatePresence>
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section className="portfolio-section experience-section" aria-labelledby="experience-title">
                  <header className="section-heading">
                    <h2 id="experience-title">experiences</h2>
                    <p>my growth welcomed many opportunities, from West to East coast</p>
                  </header>

                  <div className="experience-grid">
                    {EXPERIENCES.map((experience) => {
                      const isActive = activeExperience === experience.id;
                      return (
                        <button
                          className={`experience-card ${isActive ? "is-active" : ""}`}
                          key={experience.id}
                          type="button"
                          aria-expanded={isActive}
                          onClick={() => setActiveExperience(experience.id)}
                        >
                          <span className="experience-expand-mark" aria-hidden="true">{isActive ? "" : "+"}</span>
                          <span className="experience-title-line">
                            <img
                              src={experience.logo}
                              alt={`${experience.company} logo`}
                            />
                            <strong>{experience.role}</strong>
                          </span>
                          <AnimatePresence initial={false}>
                            {isActive && (
                              <Motion.span
                                className="experience-detail"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                              >
                                <span>{experience.detail}</span>
                              </Motion.span>
                            )}
                          </AnimatePresence>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="portfolio-section contributions-section" aria-labelledby="contributions-title">
                  <header className="section-heading">
                    <h2 id="contributions-title">contributions</h2>
                    <p>to the open-sourced community</p>
                  </header>

                  <div className="project-list">
                    {PROJECTS.map((project) => (
                      <a key={project.name} href={project.href} target="_blank" rel="noreferrer">
                        <strong>{project.name}</strong>
                        <small>{project.eyebrow}</small>
                        <span aria-hidden="true">↗</span>
                      </a>
                    ))}
                  </div>
                </section>
              </div>

              <Suspense fallback={<div className="playground-section" aria-hidden="true" />}>
                <PlaygroundUnderConstruction />
              </Suspense>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.main>
  );
}
