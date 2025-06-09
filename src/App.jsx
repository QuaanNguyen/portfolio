import { useState } from 'react'
import './App.css'
import ToggleDarkMode from './components/ToggleDarkMode'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='relative w-screen h-screen overflow-hidden bg-gray-100 dark:bg-neutral-900 transition-colors'>
        <div className='absolute top-1/4 left-1/10 size-50 rounded-full bg-radial from-yellow-600 to-gray-100 to-70% dark:to-neutral-900 transition-colors'></div>
        <div className='absolute top-2/4 left-7/10 size-50 rounded-full bg-radial from-yellow-600 to-gray-100 to-70% dark:to-neutral-900 transition-colors'></div>
        <div  className='absolute top-7 left-7' >
          <ToggleDarkMode/>
        </div>
      </div>
    </>
  )
}

export default App
