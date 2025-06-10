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
        <RadialBackground />
        <NavBar />
        <BellRing onClick={tableText} />
        <WelcomePrompt
          welcomeText={welcomeText}
          showButton={showButton}
          nextView={nextView}
        />
        <Copyright />
      </div>Í
    </>
  );
}

export default App;
