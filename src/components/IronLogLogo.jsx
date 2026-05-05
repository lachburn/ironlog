import logo from '../assets/ironlog-logo.png'
import { useTheme } from '../context/ThemeContext'

export default function IronLogLogo({ height = 44 }) {
  const { theme } = useTheme()
  const radius = Math.round(height * 0.2)
  return (
    <img
      src={logo}
      alt="IronLog"
      height={height}
      width={height}
      style={{
        display: 'block',
        objectFit: 'contain',
        borderRadius: radius,
        boxShadow: theme === 'light' ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
      }}
    />
  )
}
