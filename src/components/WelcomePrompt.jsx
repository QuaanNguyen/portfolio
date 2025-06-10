export default function WelcomePrompt({ welcomeText, showButton, nextView }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center transition-colors select-none z-30">
      <p className="font-hedvig text-7xl text-black dark:text-white font-medium mb-16 mt-[-10%]">
        {welcomeText}
      </p>
      <div className="h-12">
        {showButton && (
        <button
          className="px-4 py-2 bg-linear-to-bl from-orange-700 from-20% to-orange-400 hover:from-orange-600 hover:to-yellow-400 text-white hover:scale-110 active:scale-90 duration-300 rounded-full cursor-pointer"
          onClick={nextView}
        >
          yes, please
        </button>
      )}
      </div>
    </div>
  );
}
