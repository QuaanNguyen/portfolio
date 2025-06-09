import useDarkMode from '../hooks/useDarkMode';
import {MoonIcon, SunIcon} from '@heroicons/react/24/solid';

export default function ToggleDarkMode() {
    const { toggleDarkMode, isDarkMode } = useDarkMode();

    return (
        <button
            onClick={toggleDarkMode}
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-800 dark:text-white transition-colors duration-50"
        >
            {isDarkMode ? (
                <SunIcon className="w-10 h-10 hover:scale-110 active:scale-90 duration-300" />
            ) : (
                <MoonIcon className="w-10 h-10 hover:scale-110 active:scale-90 duration-300" />
            )}
        </button>
    )
}