'use client'

import { useTheme } from '@/contexts/ThemeContext'
import SunIcon from './icons/SunIcon'
import MoonIcon from './icons/MoonIcon'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg glass hover:glass-strong transition-all duration-200 flex items-center justify-center"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <MoonIcon className="w-5 h-5 text-gray-dark dark:text-gray" />
      ) : (
        <SunIcon className="w-5 h-5 text-gray dark:text-gray" />
      )}
    </button>
  )
}

