export default function WelcomePrompt({ onEnter }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-black dark:text-white transition-colors select-none z-30">
      <p className="absolute font-hedvig text-5xl md:text-6xl lg:text-7xl font-medium mb-25 lg:mb-12 mt-[-10%]">
        hi, i'm quan
      </p>
      <button
        onClick={onEnter}
        className="px-5 md:px-8 lg:px-10 py-2 bg-linear-to-bl from-orange-700 from-20% to-orange-400 hover:from-orange-600 hover:to-yellow-400 font-medium text-white hover:scale-110 active:scale-90 duration-300 rounded-full outline-2 outline-offset-2 outline-solid outline-orange-300 dark:outline-white cursor-pointer"
      >
        Proceed to Menu
      </button>
    </div>
  );
}
