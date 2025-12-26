import { useState } from "react";
import { Link } from "react-router-dom";
import useDarkMode from "../hooks/useDarkMode";
import Resume from "../assets/resume.pdf";
import {
  MoonIcon,
  SunIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

export default function NavBar({ isOverlayOpen }) {
  const { toggleDarkMode, isDarkMode } = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={`w-screen h-20 md:h-24 relative transition-colors duration-50 z-50 ${isOverlayOpen ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
      {/* Dark Mode Toggle */}
      <div className="absolute top-5 md:top-7 left-5 md:left-7">
        <button
          onClick={toggleDarkMode}
          className="size-8 lg:size-10 flex items-center justify-center rounded-full cursor-pointer"
        >
          {isDarkMode ? (
            <SunIcon className="hover:scale-110 active:scale-90 duration-300" />
          ) : (
            <MoonIcon className="hover:scale-110 active:scale-90 duration-300" />
          )}
        </button>
      </div>

      {/* Name */}
      <Link to="/" className="absolute top-3 md:top-5 left-1/2 transform -translate-x-1/2 text-nowrap text-4xl md:text-5xl underline underline-offset-2 select-none cursor-pointer hover:scale-105 transition-transform duration-300">
        quan nguyen
      </Link>

      {/* Right icons for medium and up */}
      <div className="absolute top-7 right-7 hidden lg:flex items-center gap-5">
        <Link to="/league-impostor" className="font-bold text-lg hover:underline underline-offset-4">
          Games
        </Link>
        <SocialIcons isOverlayOpen={isOverlayOpen} />
        <a href={Resume} download="QuanResume">
          <button className={`py-2 px-4 flex gap-2 hover:scale-105 active:scale-90 duration-300 rounded-full shadow-lg inset-ring-2 cursor-pointer items-center ${isOverlayOpen ? 'bg-transparent text-white border border-white' : 'bg-white dark:bg-neutral-800 text-black dark:text-white dark:shadow-gray-500'}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            <p className="duration-0 font-bold">Resume</p>
          </button>
        </a>
      </div>

      {/* Hamburger for small screens */}
      <div className="absolute top-5 right-5 lg:hidden">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="size-8 flex items-center justify-center rounded-full cursor-pointer"
        >
          {menuOpen ? (
            <XMarkIcon className="size-10" />
          ) : (
            <Bars3Icon className="size-10" />
          )}
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-neutral-800 text-gray-800 dark:text-white rounded-md shadow-lg p-2 flex flex-col items-start z-50">
            <Link
              to="/league-impostor"
              className="flex items-center gap-2 p-2 w-full hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition font-bold"
              onClick={() => setMenuOpen(false)}
            >
              Games
            </Link>
            <SocialIcons isDropdown />
          </div>
        )}
      </div>
    </div>
  );
}

function SocialIcons({ isDropdown, isOverlayOpen }) {
  const linkClass =
    "flex items-center gap-2 p-2 w-full hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition";
  const iconClass =
    "size-6 md:size-9 fill-current md:hover:scale-110 md:active:scale-90 md:duration-300";

  return (
    <>
      <a
        href="https://www.linkedin.com/in/quan-nguyen-127650221/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
        className={isDropdown ? linkClass : ""}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          className={iconClass}
        >
          <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
        </svg>
        {isDropdown && <span>LinkedIn</span>}
      </a>

      <a
        href="https://github.com/QuaanNguyen"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        className={isDropdown ? linkClass : ""}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          className={iconClass}
        >
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
        </svg>
        {isDropdown && <span>GitHub</span>}
      </a>
      <a href={Resume} download="QuanResume" className="md:hidden mt-0.5">
        <button className={`py-3 px-4 top-5.5 flex gap-4 right-1/11 dark:shadow-gray-500 hover:scale-105 active:scale-90 duration-300 rounded-xl shadow-lg inset-ring-2 cursor-pointer ${isOverlayOpen ? 'text-white border border-white bg-transparent' : 'text-black dark:text-white'}`}>
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
    </>
  );
}
