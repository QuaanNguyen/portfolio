import { Routes, Route } from "react-router-dom";
import "./App.css";
import NavBar from "./components/NavBar";
import RadialBackground from "./components/RadialBackground";
import Copyright from "./components/Copyright";
import MainView from "./components/MainView";
import LeagueImpostor from "./components/LeagueImpostor";

function App() {
  return (
    <>
      <div className="relative w-screen min-h-screen overflow-x-hidden lg:overflow-hidden bg-gray-100 dark:bg-neutral-900 transition-colors">
        <RadialBackground
          left="-left-1/4"
          md_left="md:left-1"
          sm_left="sm:left-0"
          top="-top-1/10"
          md_top="md:top-1"
          sm_top="sm:top-0"
          size="size-100"
          md_size="md:size-200"
          sm_size="sm:size-150"
          from="from-yellow-600"
          via="via-orange-400"
          to="to-red-400"
        />
        <RadialBackground
          left="left-3/5"
          md_left="md:left-3/5"
          sm_left="sm:left-1/3"
          top="top-2/4"
          md_top="md:top-2/5"
          sm_top="sm:top-3/5"
          size="size-70"
          md_size="md:size-130"
          sm_size="sm:size-100"
          from="from-purple-500"
          via="via-pink-400"
          to="to-blue-400"
        />
        <RadialBackground
          left="left-1"
          md_left="md:left-9/10"
          top="top-8/10"
          md_top="md:top-1"
          sm_top="sm:top-1/2"
          size="size-30"
          md_size="md:size-50"
          from="from-green-500"
          via="via-cyan-400"
          to="to-teal-200"
        />
        <NavBar />
        <Routes>
          <Route path="/" element={<MainView />} />
          <Route path="/league-impostor" element={<LeagueImpostor />} />
        </Routes>
        <div className="hidden lg:block">
          <Copyright />
        </div>
      </div>
    </>
  );
}

export default App;
