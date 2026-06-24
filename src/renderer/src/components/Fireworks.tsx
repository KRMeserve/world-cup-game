import React, { useMemo, useEffect } from 'react'

// FIFA 2026 palette + festive extras
const COLORS = [
  '#F0C84A', // gold bright
  '#ffffff',
  '#F03050', // canada red
  '#2DB56A', // mexico green
  '#4A8FE8', // usa blue bright
  '#ff9500', // orange
  '#e040fb', // purple
  '#ffeb3b', // yellow
]

interface Particle {
  id: number
  cx: number  // burst origin: vw %
  cy: number  // burst origin: vh %
  dx: number  // final offset from origin: px
  dy: number  // final offset from origin: px
  color: string
  size: number
  delay: number   // seconds
  duration: number // seconds
}

interface Props {
  onDone: () => void
}

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export function Fireworks({ onDone }: Props) {
  // Auto-dismiss after all animations complete
  useEffect(() => {
    const t = setTimeout(onDone, 3800)
    return () => clearTimeout(t)
  }, [onDone])

  const particles = useMemo<Particle[]>(() => {
    // 5 burst sites staggered across time
    const sites = [
      { cx: rnd(15, 42), cy: rnd(12, 52), delay: 0.0  },
      { cx: rnd(58, 85), cy: rnd(10, 48), delay: 0.20 },
      { cx: rnd(28, 72), cy: rnd(20, 58), delay: 0.42 },
      { cx: rnd(10, 38), cy: rnd(28, 65), delay: 0.65 },
      { cx: rnd(62, 90), cy: rnd(28, 62), delay: 0.85 },
    ]

    const PER_BURST = 30
    const out: Particle[] = []
    let id = 0

    for (const site of sites) {
      const baseColor = COLORS[Math.floor(Math.random() * COLORS.length)]
      for (let i = 0; i < PER_BURST; i++) {
        const angle = (i / PER_BURST) * Math.PI * 2 + rnd(-0.15, 0.15)
        const dist = rnd(38, 130)
        out.push({
          id: id++,
          cx: site.cx,
          cy: site.cy,
          dx: Math.cos(angle) * dist,
          // bias slightly upward so it feels more like an explosion than a ring
          dy: Math.sin(angle) * dist - rnd(10, 30),
          color: Math.random() < 0.28
            ? COLORS[Math.floor(Math.random() * COLORS.length)]
            : baseColor,
          size: rnd(3, 7),
          delay: site.delay + rnd(0, 0.07),
          duration: rnd(0.75, 1.35),
        })
      }
    }

    return out
  }, []) // [] — computed once on mount, no re-computation on re-renders

  return (
    <div className="fw-overlay" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="fw-particle"
          style={{
            left: `${p.cx}vw`,
            top: `${p.cy}vh`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${Math.round(p.size * 2)}px ${p.color}99`,
            '--fw-x': `${p.dx}px`,
            '--fw-y': `${p.dy}px`,
            '--fw-dur': `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
