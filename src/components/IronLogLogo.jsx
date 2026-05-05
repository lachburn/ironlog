import logo from '../assets/ironlog-logo.png'

export default function IronLogLogo({ height = 44 }) {
  return (
    <img
      src={logo}
      alt="IronLog"
      height={height}
      width={height}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  )
}
