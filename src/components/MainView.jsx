import ProfilePic from "../assets/picture.jpg";
import Comment from "./Comment";
import Project from "./Project";
import Copyright from "./Copyright";
import { useEffect, useMemo, useRef, useState } from "react";

import CursorLogo from "../assets/tech/cursor.svg";
import AntigravityLogo from "../assets/tech/gemini.svg";
import OllamaLogo from "../assets/tech/ollama.svg";
import HuggingFaceLogo from "../assets/tech/huggingface.svg";
import OpenAILogo from "../assets/tech/openai.svg";
import SupabaseLogo from "../assets/tech/supabase.svg";

export default function MainView() {
  const sectionStyle =
    "flex flex-col items-center justify-center p-2 lg:p-6 rounded-xl shadow-lg max-h-[85svh]";
  const experienceStyle =
    "p-2 rounded-xl border border-transparent hover:shadow-lg hover:border-gray-300 dark:shadow-gray-500 transition-shadow duration-100";

  const TECH_KEYS = useMemo(
    () => ["languages", "frameworks", "tools", "clouds"],
    []
  );

  const TABS = useMemo(() => {
    const labels = {
      languages: "Languages",
      frameworks: "Frameworks",
      tools: "Tools",
      clouds: "Clouds",
    };

    return TECH_KEYS.map((key) => ({ key, label: labels[key] }));
  }, [TECH_KEYS]);

  const TECH_STACK = useMemo(
    () => ({
      languages: [
        { label: "Python", src: "https://cdn.simpleicons.org/python/3776AB" },
        {
          label: "JavaScript",
          src: "https://cdn.simpleicons.org/javascript/F7DF1E",
        },
        {
          label: "TypeScript",
          src: "https://cdn.simpleicons.org/typescript/3178C6",
        },
        { label: "C#", src: "https://cdn.simpleicons.org/csharp/512BD4" },
        { label: "C", src: "https://cdn.simpleicons.org/c/A8B9CC" },
        { label: "C++", src: "https://cdn.simpleicons.org/cplusplus/00599C" },
      ],
      frameworks: [
        { label: "React", src: "https://cdn.simpleicons.org/react/61DAFB" },
        { label: "Node", src: "https://cdn.simpleicons.org/nodedotjs/339933" },
        {
          label: "MongoDB",
          src: "https://cdn.simpleicons.org/mongodb/47A248",
        },
        { label: "Neo4j", src: "https://cdn.simpleicons.org/neo4j/008CC1" },
        { label: ".NET", src: "https://cdn.simpleicons.org/dotnet/512BD4" },
      ],
      tools: [
        { label: "Cursor", src: CursorLogo },
        { label: "Google Antigravity", src: AntigravityLogo },
        { label: "Ollama", src: OllamaLogo },
        {
          label: "HuggingFace",
          src: HuggingFaceLogo,
        },
        {
          label: "OpenAI",
          src: OpenAILogo,
        },
      ],
      clouds: [
        {
          label: "AWS",
          src: "https://cdn.simpleicons.org/amazonwebservices/232F3E",
        },
        {
          label: "Microsoft Azure",
          src: "https://cdn.simpleicons.org/microsoftazure/0078D4",
        },
        { label: "Vercel", src: "https://cdn.simpleicons.org/vercel/000000" },
        { label: "Supabase", src: SupabaseLogo },
      ],
    }),
    []
  );

  const [activeTab, setActiveTab] = useState("languages");
  const [fadePhase, setFadePhase] = useState("in"); // "in" | "out"
  const fadeTimerRef = useRef(null);
  const isUnmountedRef = useRef(false);

  const activeItems = TECH_STACK[activeTab] ?? TECH_STACK[TECH_KEYS[0]] ?? [];

  useEffect(() => {
    if (!TECH_STACK[activeTab]) {
      // eslint-disable-next-line no-console
      console.warn("Invalid tech stack tab key:", JSON.stringify(activeTab));
    }
  }, [activeTab, TECH_STACK]);

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  const handleTabClick = (nextTab) => {
    const normalizedNextTab = String(nextTab).trim();
    if (normalizedNextTab === activeTab) return;
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    setFadePhase("out");
    fadeTimerRef.current = setTimeout(() => {
      if (isUnmountedRef.current) return;
      setActiveTab(normalizedNextTab);
      setFadePhase("in");
    }, 220);
  };

  return (
    <>

      <div className="absolute top-[60px] lg:top-[90px] left-0 w-full lg:h-[calc(100vh-150px)] lg:pb-4 flex justify-center overflow-x-hidden overflow-y-auto lg:overflow-hidden">
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:grid-rows-3 lg:grid-flow-col lg:gap-5 text-black dark:text-white transition-colors duration-0 w-full px-5 lg:px-8">
          {/* About Me Section */}
          <div
            className={`lg:row-span-2 lg:row-start-1 ${sectionStyle} order-2 `}
          >
            <div className="max-w-8/9 leading-relaxed overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-left">about me</h2>
              <p className="mb-4">
                I am currently finishing my{" "}
                <a className="font-semibold">
                  Master's in Computer Engineering
                </a>
                , looking to jump into the tech industry.
                <br />
                <br />
                With over <a className="font-bold">3 YOE</a> in building
                solutions for stakeholders, focused on{" "}
                <a className="font-semibold">optimizing system</a>. My mission
                is to build impactful products and thrive for innovation,
                enabling automation and accessibility for all.
                <br />
                <br />
                In order to achieve that, I take great care in understanding the
                problems and baselines, especially{" "}
                <a className="font-semibold">current limitations</a> to produce
                a novel solution.
              </p>

              <h2 className="text-2xl font-bold mt-4 mb-4 text-left">
                language proficiency
              </h2>
              <p className="mb-4">
                i have native fluency in{" "}
                <a className="font-semibold underline underline-offset-1">
                  English
                </a>{" "}
                and{" "}
                <a className="font-semibold underline underline-offset-1">
                  Vietnamese
                </a>
                , and can perform conversational{" "}
                <a className="font-semibold underline underline-offset-1">
                  Japanese
                </a>
                .
              </p>
            </div>
          </div>

          {/* Profile Section */}
          <div
            className={`order-1 flex-auto p-4 lg:row-span-2 lg:col-start-2 ${sectionStyle} flex-col justify-center items-center lg:gap-2 xl:gap-3 lg:justify-evenly`}
          >
            <img
              src={ProfilePic}
              alt="Profile"
              className="size-50 md:size-70 xl:size-80 object-cover rounded-2xl shadow-lg mb-3"
            />
            <div className="text-center text-3xl lg:text-4xl font-bold">
              Quan <a className="font-light">(Anh)</a> Nguyen
            </div>
            <div className="text-center text-lg text-gray-700 dark:text-gray-300">
              developer · AI enthusiast · community builder
            </div>
          </div>

          {/* Projects */}
          <div
            className={`hidden lg:block order-4 h-auto lg:min-h-[250px] lg:col-span-1 lg:row-start-3 lg:col-start-2 flex items-center justify-center p-2 lg:p-3 rounded-xl shadow-lg`}
          >
            {/* <Maintenance /> */}
            <Project />
          </div>

          {/* Comments */}
          <div
            className={`hidden lg:block min-h-[250px] lg:col-span-1 lg:row-start-3 lg:col-start-1 ${sectionStyle}`}
          >
            <Comment />
          </div>

          {/* Work Experience */}
          <div
            className={`order-3 lg:row-span-2 lg:col-start-3 ${sectionStyle}`}
          >
            <h2 className="w-full max-w-11/12 sticky top-7 text-2xl font-bold mb-4 text-left">
              experiences
            </h2>
            <div className="max-w-11/12 leading-relaxed overflow-y-auto pr-2">
              <div className={experienceStyle}>
                <p className="font-semibold">Next Lab Associate - AI/ML</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  ASU Next Lab · Oct 2025 – Current
                </p>
              </div>

              <div className={experienceStyle}>
                <p className="font-semibold">Graduate Teaching Assistant</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Arizona State University · Aug 2025 – Current
                </p>
              </div>

              <div className={experienceStyle}>
                <p className="font-semibold">Software Engineer Intern</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Maricopa County Attorney Office · Aug 2024 – May 2025
                </p>
              </div>

              <div className={experienceStyle}>
                <p className="font-semibold">Software Engineer Intern</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Crown Castle · Jun 2024 – Aug 2024
                </p>
              </div>

              <div className={experienceStyle}>
                <p className="font-semibold">
                  Cloud Developer / Teaching Assistant
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  ASU Cloud Innovation Center · Sep 2023 – May 2025
                </p>
              </div>

              <div className={experienceStyle}>
                <p className="font-semibold">
                  Undergraduate Research Assistant
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Fulton Undergraduate Research Initiative · Mar 2023 – Jul 2023
                </p>
              </div>
              <div className={experienceStyle}>
                <p className="font-semibold">Program Coordinator</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Global Launch · August 2022 – May 2023
                </p>
              </div>
              <div className={experienceStyle}>
                <p className="font-semibold">Embedded Developer</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  EPICS · August 2022 – December 2022
                </p>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div
            className={`overflow-hidden order-5 lg:row-start-3 lg:col-start-3 ${sectionStyle}`}
          >
            <div className="w-full flex flex-col gap-4">
              <div className="w-full flex flex-wrap gap-2 items-center justify-center rounded-full border border-white/15 bg-white/10 dark:bg-white/5 backdrop-blur-md px-2 py-2">
                {TABS.map((tab) => {
                  const isActive = tab.key === activeTab;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => handleTabClick(tab.key)}
                      className={[
                        "px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 select-none",
                        isActive
                          ? "bg-white/25 dark:bg-white/15 border border-white/25 shadow-sm ring-1 ring-white/15"
                          : "bg-transparent border border-transparent hover:bg-white/15 dark:hover:bg-white/10",
                      ].join(" ")}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div
                className={[
                  "w-full grid grid-flow-row grid-cols-3 sm:grid-cols-4 justify-items-center gap-4 transition-opacity duration-200",
                  fadePhase === "out" ? "opacity-0" : "opacity-100",
                ].join(" ")}
              >
                {activeItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center gap-2"
                    title={item.label}
                  >
                    <img
                      src={item.src}
                      alt={item.label}
                      className="size-12 lg:size-14 hover:scale-105 transition duration-300"
                      loading="lazy"
                      draggable="false"
                    />
                    <div className="text-xs text-center text-gray-700 dark:text-gray-300">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="order-last lg:hidden mt-30">
            <Copyright />
          </div>
        </div>
      </div>
    </>
  );
}
