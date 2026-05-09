import { memo } from 'react'
import { GemColor } from '../types'
import type { Card as CardData, PurchasableGem } from '../types'
import { GemIcon } from './GemIcon'

// ── Style maps (complete strings so Tailwind JIT detects every class) ─────────

const CARD_STYLES: Record<string, {
  gradient:  string
  border:    string
  scoreText: string
  costBg:    string
  gemGlow:   string
}> = {
  white: { gradient: 'from-slate-300 to-slate-100',     border: 'border-slate-300',   scoreText: 'text-gray-900',   costBg: 'bg-slate-500/40',    gemGlow: 'drop-shadow(0 0 7px rgba(71,85,105,0.7)) drop-shadow(0 0 14px rgba(71,85,105,0.35))'  },
  blue:  { gradient: 'from-blue-800 to-blue-600',       border: 'border-blue-400',    scoreText: 'text-white',      costBg: 'bg-blue-900/70',     gemGlow: 'drop-shadow(0 0 8px rgba(96,165,250,0.95))'  },
  green: { gradient: 'from-emerald-800 to-emerald-600', border: 'border-emerald-400', scoreText: 'text-white',      costBg: 'bg-emerald-900/70',  gemGlow: 'drop-shadow(0 0 8px rgba(52,211,153,0.95))'  },
  red:   { gradient: 'from-rose-800 to-rose-600',       border: 'border-rose-300',    scoreText: 'text-white',      costBg: 'bg-rose-900/70',     gemGlow: 'drop-shadow(0 0 8px rgba(253,164,175,0.95))' },
  black: { gradient: 'from-zinc-700 to-zinc-500',       border: 'border-zinc-300',    scoreText: 'text-white',      costBg: 'bg-zinc-800/80',     gemGlow: 'drop-shadow(0 0 8px rgba(228,228,231,0.85))' },
  gold:  { gradient: 'from-amber-700 to-amber-500',     border: 'border-amber-300',   scoreText: 'text-yellow-100', costBg: 'bg-amber-900/70',    gemGlow: 'drop-shadow(0 0 8px rgba(252,211,77,0.95))'  },
}

const TOKEN_STYLES: Record<string, {
  bg:   string
  text: string
  ring: string
}> = {
  white: { bg: 'bg-white',        text: 'text-slate-800', ring: 'ring-slate-400'   },
  blue:  { bg: 'bg-blue-500',     text: 'text-white',     ring: 'ring-blue-200'    },
  green: { bg: 'bg-emerald-500',  text: 'text-white',     ring: 'ring-emerald-200' },
  red:   { bg: 'bg-red-500',      text: 'text-white',     ring: 'ring-red-200'     },
  black: { bg: 'bg-zinc-600',     text: 'text-white',     ring: 'ring-zinc-200'    },
  gold:  { bg: 'bg-yellow-400',   text: 'text-gray-900',  ring: 'ring-yellow-200'  },
}

const COST_ORDER: GemColor[] = [
  GemColor.White, GemColor.Blue, GemColor.Green, GemColor.Red, GemColor.Black,
]

const LEVEL_NUMERAL = ['', 'I', 'II', 'III'] as const

// ── Cost token ────────────────────────────────────────────────────────────────

function CostToken({ color, count }: { color: GemColor; count: number }) {
  const s = TOKEN_STYLES[color as string] ?? TOKEN_STYLES.white
  return (
    <div
      title={`${count} ${color}`}
      className={[
        'flex items-center justify-center',
        'w-7 h-7 rounded-full ring-2 shadow-lg',
        s.bg, s.ring,
      ].join(' ')}
    >
      <span className={`text-sm font-black leading-none select-none drop-shadow-md ${s.text}`}>
        {count}
      </span>
    </div>
  )
}

// ── GameCard ──────────────────────────────────────────────────────────────────

export interface GameCardProps {
  card:          CardData
  /** Pass a stable (useCallback) reference — called with the card as argument. */
  onCardClick?:  (card: CardData) => void
  isSelected?:   boolean
  faceDown?:     boolean
  className?:    string
}

export const GameCard = memo(function GameCard({
  card,
  onCardClick,
  isSelected = false,
  faceDown   = false,
  className  = '',
}: GameCardProps) {
  // ── Face-down variant ─────────────────────────────────────────────────────
  if (faceDown) {
    return (
      <div
        role={onCardClick ? 'button' : undefined}
        onClick={onCardClick ? () => onCardClick(card) : undefined}
        className={[
          'relative w-36 h-52 rounded-xl overflow-hidden shadow-xl select-none',
          'border-2 border-zinc-700 bg-zinc-900',
          onCardClick ? 'cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95' : '',
          className,
        ].join(' ')}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-36 rounded-lg border border-zinc-700 bg-zinc-800 flex items-center justify-center">
            <span className="text-zinc-600 text-5xl select-none">✦</span>
          </div>
        </div>
        <div className="absolute inset-[3px] rounded-[10px] border border-white/5 pointer-events-none" />
      </div>
    )
  }

  // ── Face-up card ──────────────────────────────────────────────────────────
  const s = CARD_STYLES[card.bonus as string] ?? CARD_STYLES.white

  const costs = COST_ORDER
    .map(c => ({ color: c, count: card.cost[c as PurchasableGem] ?? 0 }))
    .filter(({ count }) => count > 0)

  return (
    <div
      role={onCardClick ? 'button' : undefined}
      onClick={onCardClick ? () => onCardClick(card) : undefined}
      className={[
        'relative w-36 h-52 rounded-xl overflow-hidden select-none',
        'bg-gradient-to-b', s.gradient,
        'border-2', s.border,
        onCardClick
          ? 'shadow-[0_0_18px_rgba(212,175,55,0.45)] hover:shadow-[0_0_28px_rgba(212,175,55,0.7)]'
          : 'shadow-2xl',
        'transition-all duration-150',
        onCardClick ? 'cursor-pointer hover:scale-105 hover:brightness-110 active:scale-95' : '',
        isSelected ? 'ring-4 ring-offset-2 ring-offset-gray-900 ring-yellow-400 brightness-110' : '',
        className,
      ].join(' ')}
    >
      {/* Inner inset border */}
      <div className="absolute inset-[3px] rounded-[10px] border border-white/25 pointer-events-none z-10" />

      {/* ── Prestige score — top left ─────────────────────────────────────── */}
      {card.score > 0 && (
        <div className="absolute top-2 left-3 z-20">
          <span className={`text-3xl font-black leading-none drop-shadow-lg ${s.scoreText}`}>
            {card.score}
          </span>
        </div>
      )}

      {/* ── Bonus gem — top right ─────────────────────────────────────────── */}
      <div className="absolute top-2 right-1.5 z-20" style={{ filter: s.gemGlow }}>
        {card.bonus === 'white' ? (
          <GemIcon color={card.bonus} size={38} outline className="opacity-80" />
        ) : (
          <GemIcon color={card.bonus} size={38} />
        )}
      </div>

      {/* ── Decorative background gem (large, ghosted) ───────────────────── */}
      <div className="absolute inset-x-0 top-6 flex justify-center z-0 pointer-events-none">
        {card.bonus === 'white' ? (
          <GemIcon color={card.bonus} size={92} outline className="opacity-[0.22]" />
        ) : (
          <GemIcon color={card.bonus} size={92} className="opacity-[0.13]" />
        )}
      </div>

      {/* ── Level numeral ─────────────────────────────────────────────────── */}
      <div className="absolute bottom-[68px] inset-x-0 flex justify-center z-10 pointer-events-none">
        <span className="text-[9px] font-semibold tracking-[0.35em] text-white/20 uppercase">
          {LEVEL_NUMERAL[card.level]}
        </span>
      </div>

      {/* ── Cost bar — bottom strip ───────────────────────────────────────── */}
      <div className={['absolute bottom-0 inset-x-0 h-[60px] z-20', s.costBg, 'border-t border-white/10'].join(' ')}>
        <div className="absolute top-0 inset-x-0 h-px bg-white/10" />
        <div className="h-full flex flex-wrap items-center justify-center gap-1 px-2 py-1">
          {costs.length > 0 ? (
            costs.map(({ color, count }) => (
              <CostToken key={color} color={color} count={count} />
            ))
          ) : (
            <span className="text-white/30 text-xs italic">Free</span>
          )}
        </div>
      </div>
    </div>
  )
})
