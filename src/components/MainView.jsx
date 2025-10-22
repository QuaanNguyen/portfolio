import ProfilePic from "../assets/picture.jpg";
import SQLIcon from "../assets/sql.svg";
import Resume from "../assets/resume.pdf";
import Comment from "./Comment";
import Project from "./Project";
import Maintenance from "./Maintenance";
import Copyright from "./Copyright";

export default function MainView() {
  const sectionStyle =
    "flex flex-col items-center justify-center p-2 lg:p-6 rounded-xl shadow-lg max-h-[85svh]";
  const experienceStyle =
    "p-2 rounded-xl border border-transparent hover:shadow-lg hover:border-gray-300 dark:shadow-gray-500 transition-shadow duration-100";

  return (
    <>
      <a href={Resume} download="QuanResume" className="hidden md:block">
        <button className="py-3 px-4 top-5.5 absolute flex gap-4 md:right-1/8 xl:right-1/11  text-black dark:text-white dark:shadow-gray-500 hover:scale-110 active:scale-90 duration-300 rounded-full shadow-lg inset-ring-2 cursor-pointer">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          <p className="duration-0 font-bold">Resume</p>
        </button>
      </a>
      <div className="absolute top-[60px] lg:top-[90px] left-0 w-full lg:h-[calc(100vh-150px)] lg:pb-4 flex justify-center overflow-x-hidden overflow-y-auto lg:overflow-hidden">
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:grid-rows-3 lg:grid-flow-col lg:gap-5 text-black dark:text-white transition-colors duration-0 w-full px-5 lg:px-8">
          {/* About Me Section */}
          <div
            className={`lg:row-span-2 lg:row-start-1 ${sectionStyle} order-2 `}
          >
            <div className="max-w-8/9 leading-relaxed ">
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
            <div className="w-full grid grid-flow-row grid-cols-4 justify-items-center gap-4">
              <svg
                className="size-13 lg:size-15 hover:scale-105 transition duration-300"
                viewBox="0 0 48 48"
              >
                <path fill="#ffd600" d="M6,42V6h36v36H6z"></path>
                <path
                  fill="#000001"
                  d="M29.538 32.947c.692 1.124 1.444 2.201 3.037 2.201 1.338 0 2.04-.665 2.04-1.585 0-1.101-.726-1.492-2.198-2.133l-.807-.344c-2.329-.988-3.878-2.226-3.878-4.841 0-2.41 1.845-4.244 4.728-4.244 2.053 0 3.528.711 4.592 2.573l-2.514 1.607c-.553-.988-1.151-1.377-2.078-1.377-.946 0-1.545.597-1.545 1.377 0 .964.6 1.354 1.985 1.951l.807.344C36.452 29.645 38 30.839 38 33.523 38 36.415 35.716 38 32.65 38c-2.999 0-4.702-1.505-5.65-3.368L29.538 32.947zM17.952 33.029c.506.906 1.275 1.603 2.381 1.603 1.058 0 1.667-.418 1.667-2.043V22h3.333v11.101c0 3.367-1.953 4.899-4.805 4.899-2.577 0-4.437-1.746-5.195-3.368L17.952 33.029z"
                ></path>
              </svg>
              <svg
                className="size-13 lg:size-15 hover:scale-105 transition duration-300"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#37474f"
                  fill-rule="evenodd"
                  d="M22.903,3.286c0.679-0.381,1.515-0.381,2.193,0 c3.355,1.883,13.451,7.551,16.807,9.434C42.582,13.1,43,13.804,43,14.566c0,3.766,0,15.101,0,18.867 c0,0.762-0.418,1.466-1.097,1.847c-3.355,1.883-13.451,7.551-16.807,9.434c-0.679,0.381-1.515,0.381-2.193,0 c-3.355-1.883-13.451-7.551-16.807-9.434C5.418,34.899,5,34.196,5,33.434c0-3.766,0-15.101,0-18.867 c0-0.762,0.418-1.466,1.097-1.847C9.451,10.837,19.549,5.169,22.903,3.286z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#546e7a"
                  fill-rule="evenodd"
                  d="M5.304,34.404C5.038,34.048,5,33.71,5,33.255 c0-3.744,0-15.014,0-18.759c0-0.758,0.417-1.458,1.094-1.836c3.343-1.872,13.405-7.507,16.748-9.38 c0.677-0.379,1.594-0.371,2.271,0.008c3.343,1.872,13.371,7.459,16.714,9.331c0.27,0.152,0.476,0.335,0.66,0.576L5.304,34.404z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#fff"
                  fill-rule="evenodd"
                  d="M24,10c7.727,0,14,6.273,14,14s-6.273,14-14,14 s-14-6.273-14-14S16.273,10,24,10z M24,17c3.863,0,7,3.136,7,7c0,3.863-3.137,7-7,7s-7-3.137-7-7C17,20.136,20.136,17,24,17z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#455a64"
                  fill-rule="evenodd"
                  d="M42.485,13.205c0.516,0.483,0.506,1.211,0.506,1.784 c0,3.795-0.032,14.589,0.009,18.384c0.004,0.396-0.127,0.813-0.323,1.127L23.593,24L42.485,13.205z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#fff"
                  fill-rule="evenodd"
                  d="M34 20H35V28H34zM37 20H38V28H37z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#fff"
                  fill-rule="evenodd"
                  d="M32 25H40V26H32zM32 22H40V23H32z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <svg
                className="size-13 lg:size-15 hover:scale-105 transition duration-300"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#283593"
                  fill-rule="evenodd"
                  d="M22.903,3.286c0.679-0.381,1.515-0.381,2.193,0 c3.355,1.883,13.451,7.551,16.807,9.434C42.582,13.1,43,13.804,43,14.566c0,3.766,0,15.101,0,18.867 c0,0.762-0.418,1.466-1.097,1.847c-3.355,1.883-13.451,7.551-16.807,9.434c-0.679,0.381-1.515,0.381-2.193,0 c-3.355-1.883-13.451-7.551-16.807-9.434C5.418,34.899,5,34.196,5,33.434c0-3.766,0-15.101,0-18.867 c0-0.762,0.418-1.466,1.097-1.847C9.451,10.837,19.549,5.169,22.903,3.286z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#5c6bc0"
                  fill-rule="evenodd"
                  d="M5.304,34.404C5.038,34.048,5,33.71,5,33.255 c0-3.744,0-15.014,0-18.759c0-0.758,0.417-1.458,1.094-1.836c3.343-1.872,13.405-7.507,16.748-9.38 c0.677-0.379,1.594-0.371,2.271,0.008c3.343,1.872,13.371,7.459,16.714,9.331c0.27,0.152,0.476,0.335,0.66,0.576L5.304,34.404z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#fff"
                  fill-rule="evenodd"
                  d="M24,10c7.727,0,14,6.273,14,14s-6.273,14-14,14 s-14-6.273-14-14S16.273,10,24,10z M24,17c3.863,0,7,3.136,7,7c0,3.863-3.137,7-7,7s-7-3.137-7-7C17,20.136,20.136,17,24,17z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#3949ab"
                  fill-rule="evenodd"
                  d="M42.485,13.205c0.516,0.483,0.506,1.211,0.506,1.784 c0,3.795-0.032,14.589,0.009,18.384c0.004,0.396-0.127,0.813-0.323,1.127L23.593,24L42.485,13.205z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <svg
                className="size-13 lg:size-15 hover:scale-105 transition duration-300"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#00549d"
                  fill-rule="evenodd"
                  d="M22.903,3.286c0.679-0.381,1.515-0.381,2.193,0 c3.355,1.883,13.451,7.551,16.807,9.434C42.582,13.1,43,13.804,43,14.566c0,3.766,0,15.101,0,18.867 c0,0.762-0.418,1.466-1.097,1.847c-3.355,1.883-13.451,7.551-16.807,9.434c-0.679,0.381-1.515,0.381-2.193,0 c-3.355-1.883-13.451-7.551-16.807-9.434C5.418,34.899,5,34.196,5,33.434c0-3.766,0-15.101,0-18.867 c0-0.762,0.418-1.466,1.097-1.847C9.451,10.837,19.549,5.169,22.903,3.286z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#0086d4"
                  fill-rule="evenodd"
                  d="M5.304,34.404C5.038,34.048,5,33.71,5,33.255 c0-3.744,0-15.014,0-18.759c0-0.758,0.417-1.458,1.094-1.836c3.343-1.872,13.405-7.507,16.748-9.38 c0.677-0.379,1.594-0.371,2.271,0.008c3.343,1.872,13.371,7.459,16.714,9.331c0.27,0.152,0.476,0.335,0.66,0.576L5.304,34.404z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#fff"
                  fill-rule="evenodd"
                  d="M24,10c7.727,0,14,6.273,14,14s-6.273,14-14,14 s-14-6.273-14-14S16.273,10,24,10z M24,17c3.863,0,7,3.136,7,7c0,3.863-3.137,7-7,7s-7-3.137-7-7C17,20.136,20.136,17,24,17z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#0075c0"
                  fill-rule="evenodd"
                  d="M42.485,13.205c0.516,0.483,0.506,1.211,0.506,1.784 c0,3.795-0.032,14.589,0.009,18.384c0.004,0.396-0.127,0.813-0.323,1.127L23.593,24L42.485,13.205z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#fff"
                  fill-rule="evenodd"
                  d="M31 21H33V27H31zM38 21H40V27H38z"
                  clip-rule="evenodd"
                ></path>
                <path
                  fill="#fff"
                  fill-rule="evenodd"
                  d="M29 23H35V25H29zM36 23H42V25H36z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <svg
                className="size-13 lg:size-15 hover:scale-105 transition duration-300"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#F44336"
                  d="M23.65,24.898c-0.998-1.609-1.722-2.943-2.725-5.455C19.229,15.2,31.24,11.366,26.37,3.999c2.111,5.089-7.577,8.235-8.477,12.473C17.07,20.37,23.645,24.898,23.65,24.898z"
                ></path>
                <path
                  fill="#F44336"
                  d="M23.878,17.27c-0.192,2.516,2.229,3.857,2.299,5.695c0.056,1.496-1.447,2.743-1.447,2.743s2.728-0.536,3.579-2.818c0.945-2.534-1.834-4.269-1.548-6.298c0.267-1.938,6.031-5.543,6.031-5.543S24.311,11.611,23.878,17.27z"
                ></path>
                <g>
                  <path
                    fill="#1565C0"
                    d="M32.084 25.055c1.754-.394 3.233.723 3.233 2.01 0 2.901-4.021 5.643-4.021 5.643s6.225-.742 6.225-5.505C37.521 24.053 34.464 23.266 32.084 25.055zM29.129 27.395c0 0 1.941-1.383 2.458-1.902-4.763 1.011-15.638 1.147-15.638.269 0-.809 3.507-1.638 3.507-1.638s-7.773-.112-7.773 2.181C11.683 28.695 21.858 28.866 29.129 27.395z"
                  ></path>
                  <path
                    fill="#1565C0"
                    d="M27.935,29.571c-4.509,1.499-12.814,1.02-10.354-0.993c-1.198,0-2.974,0.963-2.974,1.889c0,1.857,8.982,3.291,15.63,0.572L27.935,29.571z"
                  ></path>
                  <path
                    fill="#1565C0"
                    d="M18.686,32.739c-1.636,0-2.695,1.054-2.695,1.822c0,2.391,9.76,2.632,13.627,0.205l-2.458-1.632C24.271,34.404,17.014,34.579,18.686,32.739z"
                  ></path>
                  <path
                    fill="#1565C0"
                    d="M36.281,36.632c0-0.936-1.055-1.377-1.433-1.588c2.228,5.373-22.317,4.956-22.317,1.784c0-0.721,1.807-1.427,3.477-1.093l-1.42-0.839C11.26,34.374,9,35.837,9,37.017C9,42.52,36.281,42.255,36.281,36.632z"
                  ></path>
                  <path
                    fill="#1565C0"
                    d="M39,38.604c-4.146,4.095-14.659,5.587-25.231,3.057C24.341,46.164,38.95,43.628,39,38.604z"
                  ></path>
                </g>
              </svg>
              <svg
                className="size-13 lg:size-15 hover:scale-105 transition duration-300"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#0277BD"
                  d="M24.047,5c-1.555,0.005-2.633,0.142-3.936,0.367c-3.848,0.67-4.549,2.077-4.549,4.67V14h9v2H15.22h-4.35c-2.636,0-4.943,1.242-5.674,4.219c-0.826,3.417-0.863,5.557,0,9.125C5.851,32.005,7.294,34,9.931,34h3.632v-5.104c0-2.966,2.686-5.896,5.764-5.896h7.236c2.523,0,5-1.862,5-4.377v-8.586c0-2.439-1.759-4.263-4.218-4.672C27.406,5.359,25.589,4.994,24.047,5z M19.063,9c0.821,0,1.5,0.677,1.5,1.502c0,0.833-0.679,1.498-1.5,1.498c-0.837,0-1.5-0.664-1.5-1.498C17.563,9.68,18.226,9,19.063,9z"
                ></path>
                <path
                  fill="#FFC107"
                  d="M23.078,43c1.555-0.005,2.633-0.142,3.936-0.367c3.848-0.67,4.549-2.077,4.549-4.67V34h-9v-2h9.343h4.35c2.636,0,4.943-1.242,5.674-4.219c0.826-3.417,0.863-5.557,0-9.125C41.274,15.995,39.831,14,37.194,14h-3.632v5.104c0,2.966-2.686,5.896-5.764,5.896h-7.236c-2.523,0-5,1.862-5,4.377v8.586c0,2.439,1.759,4.263,4.218,4.672C19.719,42.641,21.536,43.006,23.078,43z M28.063,39c-0.821,0-1.5-0.677-1.5-1.502c0-0.833,0.679-1.498,1.5-1.498c0.837,0,1.5,0.664,1.5,1.498C29.563,38.32,28.899,39,28.063,39z"
                ></path>
              </svg>
              <svg
                className="size-13 lg:size-15 hover:scale-105 transition duration-300"
                viewBox="0 0 48 48"
              >
                <linearGradient
                  id="__u04104Xr4WevsSMNpCfa_CLvQeiwFpit4_gr1"
                  x1="7.773"
                  x2="29.818"
                  y1="6.952"
                  y2="27.783"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0" stop-color="#bec1c4"></stop>
                  <stop offset="1" stop-color="#939399"></stop>
                </linearGradient>
                <path
                  fill="url(#__u04104Xr4WevsSMNpCfa_CLvQeiwFpit4_gr1)"
                  d="M24,6C10.745,6,0,13.291,0,22.286s10.745,16.286,24,16.286s24-7.291,24-16.286S37.255,6,24,6 z M26.5,35C16.283,35,8,29.627,8,23s8.283-12,18.5-12S45,16.373,45,23S36.717,35,26.5,35z"
                ></path>
                <linearGradient
                  id="__u04104Xr4WevsSMNpCfb_CLvQeiwFpit4_gr2"
                  x1="25.124"
                  x2="32.304"
                  y1="14.251"
                  y2="35.285"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset=".003" stop-color="#008ded"></stop>
                  <stop offset="1" stop-color="#0061a7"></stop>
                </linearGradient>
                <path
                  fill="url(#__u04104Xr4WevsSMNpCfb_CLvQeiwFpit4_gr2)"
                  d="M39.051,33.469 c-0.578-0.945-1.437-1.669-2.442-2.105c3.401-0.841,5.926-3.904,5.926-7.564c0-4.307-3.493-7.8-7.8-7.8H20.001v26h6.933V31.6h1.955 c0.967,0,1.856,0.525,2.321,1.373L36.175,42h8.093L39.051,33.469z M26.935,21.2h6.067c1.435,0,2.6,1.165,2.6,2.6 s-1.165,2.6-2.6,2.6h-6.067V21.2z"
                ></path>
              </svg>
              <img
                src={SQLIcon}
                className="size-12 lg:size-14 hover:scale-105 transition duration-300"
              />
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
