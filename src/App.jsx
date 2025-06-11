import "./App.css";
import NavBar from "./components/NavBar";
import RadialBackground from "./components/RadialBackground";
import Copyright from "./components/Copyright";
import MainView from "./components/MainView";

function App() {
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
        <MainView />
        <Copyright />
      </div>
      Í
    </>
  );
}

export default App;
