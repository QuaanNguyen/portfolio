


export default function WelcomePrompt({nextView}) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 transition-colors select-none">
            <p className="text-7xl text-gray-900 dark:text-gray-300 mb-16 mt-[-10%]">Hi, table for one?</p>
            <button 
                className="px-4 py-2 bg-linear-to-bl from-orange-700 from-20% to-orange-400 hover:from-orange-600 hover:to-yellow-400 text-white hover:scale-110 active:scale-90 duration-300 rounded-full cursor-pointer"
                onClick={nextView}>
                hello, yes please
            </button>
        </div>
    );
}