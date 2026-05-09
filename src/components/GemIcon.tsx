import type { GemColor } from '../types'

interface GemDef {
  body: string
  edge: string
  shine: string
}

// Inline hex colors — not Tailwind — so SVG attributes pick them up directly
const DEFS: Record<string, GemDef> = {
  white: { body: '#e2e8f0', edge: '#cbd5e1', shine: '#ffffff'  },
  blue:  { body: '#2563eb', edge: '#93c5fd', shine: '#dbeafe'  },
  green: { body: '#059669', edge: '#6ee7b7', shine: '#d1fae5'  },
  red:   { body: '#e11d48', edge: '#fda4af', shine: '#ffe4e6'  },
  black: { body: '#52525b', edge: '#e4e4e7', shine: '#f4f4f5'  },
  gold:  { body: '#d97706', edge: '#fcd34d', shine: '#fef9c3'  },
}

export function GemIcon({
  color,
  size = 32,
  outline = false,
  className,
}: {
  color:     GemColor | string
  size?:     number
  outline?:  boolean
  className?: string
}) {
  const d = DEFS[color as string] ?? DEFS.white

  if (outline) {
    // Stroke-only "watermark" variant — used as the large background decoration
    const stroke = '#475569'
    return (
      <svg
        width={size}
        height={Math.round(size * 1.3)}
        viewBox="0 0 40 52"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <polygon
          points="20,1 39,17 20,51 1,17"
          fill="transparent"
          stroke={stroke}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <line x1="1"  y1="17" x2="39" y2="17" stroke={stroke} strokeWidth="0.8" opacity="0.7" />
        <line x1="20" y1="1"  x2="10" y2="17" stroke={stroke} strokeWidth="0.6" opacity="0.5" />
        <line x1="20" y1="1"  x2="30" y2="17" stroke={stroke} strokeWidth="0.6" opacity="0.5" />
        <line x1="10" y1="17" x2="20" y2="51" stroke={stroke} strokeWidth="0.6" opacity="0.4" />
        <line x1="30" y1="17" x2="20" y2="51" stroke={stroke} strokeWidth="0.6" opacity="0.4" />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={Math.round(size * 1.3)}
      viewBox="0 0 40 52"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Main gem body */}
      <polygon
        points="20,1 39,17 20,51 1,17"
        fill={d.body}
        stroke={d.edge}
        strokeWidth={color === 'black' ? '2.5' : '1.5'}
        strokeLinejoin="round"
      />
      {/* Girdle */}
      <line x1="1" y1="17" x2="39" y2="17" stroke={d.edge} strokeWidth="1" opacity="0.8" />
      {/* Crown facets */}
      <line x1="20" y1="1" x2="10" y2="17" stroke={d.edge} strokeWidth="0.8" opacity="0.6" />
      <line x1="20" y1="1" x2="30" y2="17" stroke={d.edge} strokeWidth="0.8" opacity="0.6" />
      {/* Crown highlight */}
      <polygon points="20,2 30,17 10,17" fill={d.shine} opacity="0.22" />
      {/* Pavilion facets */}
      <line x1="10" y1="17" x2="20" y2="51" stroke={d.edge} strokeWidth="0.8" opacity="0.45" />
      <line x1="30" y1="17" x2="20" y2="51" stroke={d.edge} strokeWidth="0.8" opacity="0.45" />
    </svg>
  )
}
