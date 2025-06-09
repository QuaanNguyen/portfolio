import { useState } from 'react'
import './App.css'
import ToggleDarkMode from './components/ToggleDarkMode'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='relative w-screen h-screen overflow-hidden bg-gray-100 dark:bg-neutral-900 transition-colors'>
        <div className='absolute top-1/5 left-1/10 size-150 rounded-full bg-radial from-yellow-600 to-gray-100 to-70% dark:to-neutral-900 transition-colors'></div>
        <div className='absolute top-2/4 left-7/10 size-100 rounded-full bg-radial from-yellow-600 to-gray-100 to-70% dark:to-neutral-900 transition-colors'></div>
        <div  className='absolute top-7 left-7' >
          <ToggleDarkMode/>
        </div>
        <div className='absolute bottom-0 left-1/2 -translate-x-1/2 text-center dark:text-gray-100 transition-colors'>&copy; 2025 Quan Nguyen</div>
      </div>
    </>
  )
}

export default App
