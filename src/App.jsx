import "./App.css";
import NavBar from "./components/NavBar";
import WelcomePrompt from "./components/WelcomePrompt";
import Copyright from "./components/Copyright";
import RadialBackground from "./components/RadialBackground";
import BellRing from "./components/BellRing";
import useChangeText from "./hooks/useChangeText";

function App() {
  const { welcomeText, tableText, showButton } = useChangeText();

  const nextView = () => {
    // Logic to change view or navigate to another component
    console.log("Next view triggered");
  };

  return (
    <>
      <div className="relative w-screen h-screen overflow-hidden bg-gray-100 dark:bg-neutral-900 transition-colors">
        <RadialBackground
          left="left-1"
          top="top-1"
          size="size-200"
          from="from-yellow-600"
          via="via-orange-400"
          to="to-red-400"
        />
        <RadialBackground
          left="left-3/5"
          top="top-2/5"
          size="size-130"
          from="from-purple-500"
          via="via-pink-400"
          to="to-blue-400"
        />
        <RadialBackground
          left="left-9/10"
          top="top-1"
          size="size-50"
          from="from-green-500"
          via="via-cyan-400"
          to="to-teal-200"
        />
        <NavBar />
        <BellRing onClick={tableText} />
        <WelcomePrompt
          welcomeText={welcomeText}
          showButton={showButton}
          nextView={nextView}
        />
        <Copyright />
      </div>
      Í
    </>
  );
}

export default App;
