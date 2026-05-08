// Simple SVG line chart — no dependencies
export default function LineChart({ data, color = 'var(--accent)' }) {
  if (!data || data.length === 0) return null

  const W = 320
  const H = 160
  const PAD = { top: 16, right: 16, bottom: 28, left: 44 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const values = data.map(d => d.y)
  const mostRecent = values[values.length - 1]
  const maxY = Math.max(
    mostRecent > 0 ? mostRecent / 0.75 : 1,
    Math.max(...values),
  )

  const scaleX = (i) => PAD.left + (i / Math.max(data.length - 1, 1)) * innerW
  const scaleY = (v) => PAD.top + innerH - (v / maxY) * innerH

  // Build polyline points
  const points = data.map((d, i) => `${scaleX(i)},${scaleY(d.y)}`).join(' ')

  // Build fill path (close under the line)
  const fillPath = [
    `M ${scaleX(0)} ${scaleY(data[0].y)}`,
    ...data.map((d, i) => `L ${scaleX(i)} ${scaleY(d.y)}`),
    `L ${scaleX(data.length - 1)} ${PAD.top + innerH}`,
    `L ${scaleX(0)} ${PAD.top + innerH}`,
    'Z',
  ].join(' ')

  // Y axis labels (3 ticks: 0, midpoint, max)
  const yTicks = [0, maxY / 2, maxY]

  // X axis labels (show first, middle, last if > 2 points)
  const xLabels = data.length <= 1
    ? [0]
    : data.length === 2
    ? [0, 1]
    : [0, Math.floor((data.length - 1) / 2), data.length - 1]

  const fmtDate = (iso) => {
    const d = new Date(iso)
    return `${d.getDate()}/${d.getMonth() + 1}`
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Horizontal grid lines */}
      {yTicks.map((v, i) => (
        <line
          key={i}
          x1={PAD.left} y1={scaleY(v)}
          x2={PAD.left + innerW} y2={scaleY(v)}
          stroke="var(--border)" strokeWidth="1"
        />
      ))}

      {/* Y axis labels */}
      {yTicks.map((v, i) => (
        <text
          key={i}
          x={PAD.left - 6} y={scaleY(v) + 4}
          textAnchor="end"
          fontSize="10"
          fill="var(--muted)"
          fontFamily="'Inter Tight', system-ui, sans-serif"
        >
          {Number.isInteger(v) ? v : v.toFixed(1)}
        </text>
      ))}

      {/* X axis labels */}
      {xLabels.map((i) => (
        <text
          key={i}
          x={scaleX(i)} y={H - 4}
          textAnchor="middle"
          fontSize="10"
          fill="var(--muted)"
          fontFamily="'Inter Tight', system-ui, sans-serif"
        >
          {fmtDate(data[i].x)}
        </text>
      ))}

      {/* Fill area */}
      <path d={fillPath} fill="url(#chartFill)" />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={scaleX(i)} cy={scaleY(d.y)}
          r="4"
          fill="var(--surface)"
          stroke={color}
          strokeWidth="2"
        />
      ))}
    </svg>
  )
}
