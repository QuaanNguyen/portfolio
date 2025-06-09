import './App.css';
import ToggleDarkMode from './components/ToggleDarkMode';
import WelcomePrompt from './components/WelcomePrompt';
import Copyright from './components/Copyright';
import RadialBackground from './components/RadialBackground';
import BellRing from './components/BellRing';

function App() {

  return (
    <>
      <div className='relative w-screen h-screen overflow-hidden bg-gray-100 dark:bg-neutral-900 transition-colors'>
        <RadialBackground />
        <ToggleDarkMode />
        <BellRing />
        <WelcomePrompt />
        <Copyright />
      </div>
    </>
  )
}

export default App
