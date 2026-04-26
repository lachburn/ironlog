import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 22,
        padding: 8,
        minWidth: 44,
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        color: 'var(--text-secondary)',
        transition: 'color 200ms ease',
      }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
