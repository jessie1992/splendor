import { useState, useCallback, useMemo, useRef, memo, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { GemColor } from '../types'
import type { Card, CardLevel, GemStash, Noble, Player, PurchasableGem } from '../types'
import { useGameStore } from '../store'
import { canAfford } from '../gameLogic'
import { GameCard } from './GameCard'
import { GemIcon } from './GemIcon'

// ── Constants ─────────────────────────────────────────────────────────────────

const PURCHASABLE: PurchasableGem[] = [
  GemColor.White, GemColor.Blue, GemColor.Green, GemColor.Red, GemColor.Black,
]

const ALL_GEM_COLORS: GemColor[] = [...PURCHASABLE, GemColor.Gold]

const LEVEL_NUMERAL: Record<CardLevel, string> = { 1: 'I', 2: 'II', 3: 'III' }

const DECK_STYLE: Record<CardLevel, string> = {
  1: 'bg-emerald-900 border-emerald-700',
  2: 'bg-amber-900   border-amber-700',
  3: 'bg-blue-900    border-blue-700',
}

const BONUS_BADGE: Record<string, string> = {
  white: 'bg-slate-200  text-gray-900',
  blue:  'bg-blue-600   text-white',
  green: 'bg-emerald-600 text-white',
  red:   'bg-rose-600   text-white',
  black: 'bg-zinc-700   text-white',
}

// ── Sub-components (all memo'd to skip re-renders when props unchanged) ────────

const DeckPile = memo(function DeckPile({
  level, count, onReserve, canReserve,
}: {
  level: CardLevel
  count: number
  onReserve?: () => void
  canReserve?: boolean
}) {
  const style = DECK_STYLE[level]
  return (
    <div className="relative group w-16 h-[104px] flex-shrink-0">
      {count > 1 && (
        <div className={`absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-xl border ${style} opacity-60`} />
      )}
      {count > 0 ? (
        <div className={`absolute inset-0 rounded-xl border ${style} flex flex-col items-center justify-center gap-1`}>
          <span className="text-[10px] font-bold text-white/40 tracking-[0.2em]">
            {LEVEL_NUMERAL[level]}
          </span>
          <span className="text-white font-black text-xl tabular-nums">{count}</span>
          {onReserve && (
            <button
              onClick={onReserve}
              disabled={!canReserve}
              className="absolute inset-x-1 bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity py-0.5 rounded-lg bg-zinc-700/90 hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-bold text-white"
            >
              Reserve
            </button>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 rounded-xl border border-dashed border-white/10 flex items-center justify-center">
          <span className="text-white/20 text-sm">—</span>
        </div>
      )}
    </div>
  )
})

const NobleTile = memo(function NobleTile({ noble }: { noble: Noble }) {
  const requirements = PURCHASABLE.filter(c => (noble.requirement[c] ?? 0) > 0)
  return (
    <div
      className="relative w-[84px] h-[100px] flex-shrink-0 rounded-xl overflow-hidden select-none"
      style={{ background: 'linear-gradient(160deg, #1c1108 0%, #2d1c08 50%, #1a1006 100%)' }}
    >
      <div className="absolute inset-0 rounded-xl ring-1 ring-amber-500/60 pointer-events-none z-20" />
      <div className="absolute inset-[3px] rounded-[9px] ring-1 ring-amber-700/25 pointer-events-none z-20" />
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/90 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />
      <div
        className="absolute inset-x-0 top-0 h-10 flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, rgba(180,120,10,0.18) 0%, transparent 100%)' }}
      >
        <span className="text-[26px] leading-none" style={{ filter: 'drop-shadow(0 0 8px rgba(252,211,77,0.65))' }}>
          ♚
        </span>
      </div>
      <div
        className="absolute top-1.5 right-1.5 z-10 w-[22px] h-[22px] rounded-full flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle, #f59e0b 0%, #b45309 100%)',
          boxShadow: '0 0 8px rgba(245,158,11,0.7), inset 0 1px 0 rgba(255,255,255,0.25)',
        }}
      >
        <span className="text-[12px] font-black text-amber-950 leading-none">{noble.score}</span>
      </div>
      <span className="absolute top-[3px] left-[5px] text-[7px] text-amber-600/35 leading-none">✦</span>
      <span className="absolute bottom-[3px] right-[5px] text-[7px] text-amber-600/35 leading-none">✦</span>
      <div className="absolute inset-x-3 top-10 h-px bg-gradient-to-r from-transparent via-amber-600/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[52px] flex items-center justify-center px-2">
        <div
          className="grid gap-x-2 gap-y-1 justify-items-center"
          style={{ gridTemplateColumns: `repeat(${Math.min(requirements.length, 3)}, minmax(0, 1fr))` }}
        >
          {requirements.map(c => (
            <div key={c} className="flex flex-col items-center gap-[2px]">
              <GemIcon color={c} size={14} />
              <span className="text-[10px] text-amber-100 font-black leading-none tabular-nums">
                {noble.requirement[c]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

type PendingGems = Partial<Record<GemColor, number>>

const GemSupply = memo(function GemSupply({
  gems,
  pending,
  onGemClick,
}: {
  gems:       GemStash
  pending:    PendingGems
  onGemClick: (color: GemColor) => void
}) {
  return (
    <div className="flex items-end gap-1">
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest pb-1 mr-2">
        Supply
      </span>
      {PURCHASABLE.map(color => {
        const available = gems[color]
        const selected  = pending[color] ?? 0
        const disabled  = available === 0
        return (
          <button
            key={color}
            onClick={() => onGemClick(color)}
            disabled={disabled}
            className={[
              'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-150 select-none',
              selected > 0
                ? 'bg-white/20 ring-2 ring-white/50 scale-110 shadow-lg'
                : disabled
                  ? 'opacity-25 cursor-not-allowed'
                  : 'hover:bg-white/10 cursor-pointer',
            ].join(' ')}
          >
            <GemIcon color={color} size={22} />
            <span className={`text-xs font-bold tabular-nums ${available === 0 ? 'text-white/20' : 'text-white'}`}>
              {available}
            </span>
            {selected > 0 && (
              <span className="text-[10px] font-black text-yellow-300 leading-none">+{selected}</span>
            )}
          </button>
        )
      })}
      <div className="flex flex-col items-center gap-0.5 px-2 py-1.5 opacity-60">
        <GemIcon color={GemColor.Gold} size={22} />
        <span className={`text-xs font-bold tabular-nums ${gems[GemColor.Gold] === 0 ? 'text-white/20' : 'text-white'}`}>
          {gems[GemColor.Gold]}
        </span>
      </div>
    </div>
  )
})

const DiscardPanel = memo(function DiscardPanel({
  playerGems, toReturn, mustReturn, onToggle, onConfirm, onReset,
}: {
  playerGems: GemStash
  toReturn:   PendingGems
  mustReturn: number
  onToggle:   (color: GemColor) => void
  onConfirm:  () => void
  onReset:    () => void
}) {
  const returnCount = Object.values(toReturn).reduce((a, b) => a + (b ?? 0), 0)
  const remaining   = mustReturn - returnCount

  return (
    <div className="rounded-xl bg-red-950/60 border border-red-500/50 px-4 py-3 space-y-3">
      <p className="text-red-300 font-semibold text-sm">
        Over limit — select {remaining > 0 ? `${remaining} more gem${remaining > 1 ? 's' : ''}` : 'done'} to return
      </p>
      <div className="flex flex-wrap gap-2">
        {ALL_GEM_COLORS.map(color => {
          const held = playerGems[color]
          const ret  = toReturn[color] ?? 0
          if (held === 0) return null
          return (
            <button
              key={color}
              onClick={() => onToggle(color)}
              className={[
                'relative flex flex-col items-center px-2.5 py-1.5 rounded-xl border-2 transition-all select-none',
                ret > 0
                  ? 'border-red-400 bg-red-500/25 scale-105'
                  : remaining > 0
                    ? 'border-white/20 bg-white/5 hover:bg-white/15 cursor-pointer'
                    : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed',
              ].join(' ')}
            >
              <GemIcon color={color} size={20} />
              <span className="text-xs font-bold text-white tabular-nums mt-0.5">{held - ret}</span>
              {ret > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center leading-none">
                  -{ret}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={remaining !== 0}
          className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 active:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
        >
          Confirm Return
        </button>
        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
})

const PlayerPanel = memo(function PlayerPanel({ player, isActive }: { player: Player; isActive: boolean; }) {
  const bonusesFor = (c: PurchasableGem) =>
    player.purchasedCards.filter(card => card.bonus === c).length

  return (
    <div
      className={[
        'rounded-xl p-3 border transition-colors backdrop-blur-sm',
        isActive
          ? 'border-yellow-400/70 bg-yellow-400/15 shadow-[0_0_16px_rgba(212,175,55,0.2)]'
          : 'border-white/10 bg-gray-800/50',
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className={`font-semibold text-sm truncate leading-none ${isActive ? 'text-yellow-300' : 'text-white/80'}`}>
          {isActive && <span className="mr-1 text-yellow-400">▶</span>}
          {player.isCpu && <span className="mr-1">🤖</span>}
          {player.name}
        </span>
        <span className="text-yellow-400 font-black text-xl tabular-nums leading-none flex-shrink-0">
          {player.score}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {ALL_GEM_COLORS.map(c =>
          player.gems[c] > 0 ? (
            <span key={c} className="flex items-center gap-0.5">
              <GemIcon color={c} size={13} />
              <span className="text-[11px] text-white/60 tabular-nums">{player.gems[c]}</span>
            </span>
          ) : null
        )}
        {ALL_GEM_COLORS.every(c => player.gems[c] === 0) && (
          <span className="text-[11px] text-white/20">no gems</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {PURCHASABLE.map(c => {
          const count = bonusesFor(c)
          return count > 0 ? (
            <span key={c} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${BONUS_BADGE[c as string]}`}>
              +{count}
            </span>
          ) : null
        })}
      </div>
      {player.reservedCards.length > 0 && (
        <div className="mt-1 flex items-center gap-1 flex-wrap">
          {player.reservedCards.map(c => (
            <span
              key={c.id}
              className={`text-[11px] px-1.5 py-0.5 rounded font-bold leading-none ${
                player.faceDownReservedIds.includes(c.id)
                  ? 'bg-zinc-700 text-zinc-400'
                  : 'bg-zinc-600 text-white'
              }`}
            >
              {player.faceDownReservedIds.includes(c.id) ? '▪' : 'I'.repeat(c.level)}
            </span>
          ))}
        </div>
      )}
      {player.nobles.length > 0 && (
        <div className="mt-1.5 text-[10px] text-amber-400 font-semibold">
          {player.nobles.length} noble{player.nobles.length > 1 ? 's' : ''}
          {' '}(+{player.nobles.reduce((s, n) => s + n.score, 0)} pts)
        </div>
      )}
    </div>
  )
})

const PurchaseOverlay = memo(function PurchaseOverlay({
  onConfirm, onCancel,
}: {
  onConfirm: () => void
  onCancel:  () => void
}) {
  return (
    <div className="absolute inset-0 rounded-xl bg-black/60 flex flex-col items-center justify-center gap-2 z-10">
      <button
        onClick={onConfirm}
        className="w-24 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-gray-900 text-sm font-black transition-colors shadow-lg"
      >
        Buy
      </button>
      <button
        onClick={onCancel}
        className="w-24 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-semibold transition-colors"
      >
        Cancel
      </button>
    </div>
  )
})

// ── Main Board ────────────────────────────────────────────────────────────────

export function Board() {
  // ── Store — state via shallow, actions are stable references ────────────
  const { players, currentPlayerIndex, board, phase, moveCount } = useGameStore(
    useShallow(s => ({
      players:            s.players,
      currentPlayerIndex: s.currentPlayerIndex,
      board:              s.board,
      phase:              s.phase,
      moveCount:          s.moveCount,
    }))
  )
  const goHome          = useGameStore(s => s.goHome)
  const completePurchase        = useGameStore(s => s.completePurchase)
  const completeReserve         = useGameStore(s => s.completeReserve)
  const completeReserveFromDeck = useGameStore(s => s.completeReserveFromDeck)
  const drawTokens              = useGameStore(s => s.drawTokens)
  const completeDrawTokens      = useGameStore(s => s.completeDrawTokens)
  const completeReturn          = useGameStore(s => s.completeReturn)
  const doAiTurn                = useGameStore(s => s.doAiTurn)

  const currentPlayer = players[currentPlayerIndex]

  // ── Card purchase confirmation ────────────────────────────────────────────
  const [pendingCard, setPendingCard] = useState<Card | null>(null)

  const confirmPurchase = useCallback(() => {
    if (!pendingCard) return
    completePurchase(pendingCard)
    setPendingCard(null)
    setPending({})
  }, [pendingCard, completePurchase])

  // ── Gem selection ─────────────────────────────────────────────────────────
  const [pending, setPending]     = useState<PendingGems>({})
  const [discardMode, setDiscard] = useState(false)
  const [toReturn, setToReturn]   = useState<PendingGems>({})

  const totalPending   = Object.values(pending).reduce((a, b) => a + (b ?? 0), 0)
  const distinctColors = (Object.keys(pending) as GemColor[]).filter(c => (pending[c] ?? 0) > 0)
  const hasDouble      = distinctColors.some(c => (pending[c] ?? 0) >= 2)
  const totalHeld      = Object.values(currentPlayer.gems).reduce((a, b) => a + b, 0)
  const mustReturn     = Math.max(0, totalHeld - 10)  // > 0 only when in discard mode
  const isValidSelection =
    totalPending > 0 &&
    (hasDouble || distinctColors.length === totalPending)

  // ── Memoised affordability set — recomputed only when player/board changes ─
  const affordableIds = useMemo(() => {
    const ids = new Set<string>()
    const check = (card: Card | null) => {
      if (card && canAfford(currentPlayer, card)) ids.add(card.id)
    }
    ;([1, 2, 3] as CardLevel[]).forEach(l => board.visibleCards[l].forEach(check))
    currentPlayer.reservedCards.forEach(check)
    return ids
  }, [currentPlayer, board.visibleCards])

  // Keep a ref so handleCardClick can read the latest affordableIds without
  // being recreated every time it changes (which would defeat React.memo on GameCard).
  const affordableRef = useRef(affordableIds)
  affordableRef.current = affordableIds

  // ── Handlers ──────────────────────────────────────────────────────────────

  // Gem click: uses functional setState — no dependency on `pending` snapshot
  const handleGemClick = useCallback((color: GemColor) => {
    const available = board.gems[color]
    setPending(prev => {
      const current  = prev[color] ?? 0
      const distinct = (Object.keys(prev) as GemColor[]).filter(c => (prev[c] ?? 0) > 0)
      const total    = distinct.reduce((a, c) => a + (prev[c] ?? 0), 0)
      const hasDb    = distinct.some(c => (prev[c] ?? 0) >= 2)

      if (current === 2) {
        const n = { ...prev }; delete n[color]; return n
      }
      if (current === 1) {
        const isOnly = distinct.length === 1 && total === 1
        if (isOnly && available >= 4) return { [color]: 2 }
        const n = { ...prev }; delete n[color]; return n
      }
      if (hasDb || total >= 3 || available < 1) return prev
      return { ...prev, [color]: 1 }
    })
  }, [board.gems])

  const handleTakeGems = useCallback(() => {
    if (!isValidSelection) return
    const colors: GemColor[] = []
    for (const c of distinctColors) {
      const n = pending[c] ?? 0
      for (let i = 0; i < n; i++) colors.push(c)
    }
    if (totalHeld + totalPending > 10) {
      drawTokens(colors)       // separate set() needed — discard UI reads updated gems
      setDiscard(true)
      setToReturn({})
    } else {
      completeDrawTokens(colors)  // atomic: draw + advance in one set()
    }
    setPending({})
  }, [isValidSelection, distinctColors, pending, drawTokens, completeDrawTokens, totalHeld, totalPending])

  const handleToggleReturn = useCallback((color: GemColor) => {
    setToReturn(prev => {
      const current  = prev[color] ?? 0
      const maxForColor = currentPlayer.gems[color]
      if (current >= maxForColor) {
        const n = { ...prev }; delete n[color]; return n
      }
      return { ...prev, [color]: current + 1 }
    })
  }, [currentPlayer.gems])

  const handleConfirmReturn = useCallback(() => {
    completeReturn(toReturn)
    setDiscard(false)
    setToReturn({})
  }, [completeReturn, toReturn])

  const handleResetReturn = useCallback(() => setToReturn({}), [])

  // Stable reference — reads affordability from ref, so GameCard memo is preserved.
  const handleCardClick = useCallback((card: Card) => {
    if (!affordableRef.current.has(card.id)) return
    setPendingCard(prev => prev?.id === card.id ? null : card)
    setPending({})
  }, [])  // no deps — stable across all renders

  const handleReserve = useCallback((card: Card) => {
    if (currentPlayer.reservedCards.length >= 3) return
    completeReserve(card)
    setPendingCard(null)
    setPending({})
  }, [currentPlayer.reservedCards.length, completeReserve])

  const handleReserveFromDeck = useCallback((level: CardLevel) => {
    if (currentPlayer.reservedCards.length >= 3) return
    completeReserveFromDeck(level)
    setPendingCard(null)
    setPending({})
  }, [currentPlayer.reservedCards.length, completeReserveFromDeck])

  const handleCancelPurchase = useCallback(() => setPendingCard(null), [])
  const handleClearGems      = useCallback(() => setPending({}), [])

  // ── AI auto-play ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'lastRound') return
    if (!currentPlayer?.isCpu) return

    const id = setTimeout(doAiTurn, 700)
    return () => clearTimeout(id)
  }, [currentPlayerIndex, phase, currentPlayer?.isCpu, doAiTurn])

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="relative min-h-screen text-white"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #1e293b 0%, #000000 100%)' }}
    >
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Home button */}
      <button
        onClick={goHome}
        className="absolute top-3 right-4 z-30 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 text-xs font-semibold text-white/60 hover:text-white transition-all border border-white/10"
      >
        ← Home
      </button>

      {phase === 'lastRound' && (
        <div className="bg-yellow-600/90 text-center py-2 px-4 text-sm font-semibold tracking-wide">
          ⚡ Final round — a player has reached 15 prestige points!
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── Player panels ─────────────────────────────────────────────── */}
        <div className={`grid gap-3 ${players.length <= 2 ? 'grid-cols-2' : 'grid-cols-4'}`}>
          {players.map((p, i) => (
            <PlayerPanel key={p.id} player={p} isActive={i === currentPlayerIndex} />
          ))}
        </div>

        {/* ── Noble tiles ───────────────────────────────────────────────── */}
        {board.nobles.length > 0 && (
          <div className="flex gap-3 justify-center flex-wrap">
            {board.nobles.map(n => <NobleTile key={n.id} noble={n} />)}
          </div>
        )}

        {/* ── Current player's reserved cards ───────────────────────────── */}
        {currentPlayer.reservedCards.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Your Reserved Cards
            </p>
            <div className="flex gap-3 flex-wrap">
              {currentPlayer.reservedCards.map(card => (
                <div key={card.id} className="relative flex-shrink-0">
                  <GameCard
                    card={card}
                    isSelected={pendingCard?.id === card.id}
                    onCardClick={handleCardClick}
                    className={affordableIds.has(card.id) ? '' : 'opacity-35 cursor-not-allowed'}
                  />
                  {pendingCard?.id === card.id && (
                    <PurchaseOverlay onConfirm={confirmPurchase} onCancel={handleCancelPurchase} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Card rows (level 3 → 1) ───────────────────────────────────── */}
        <div className="space-y-4 overflow-x-auto pb-2">
          {([3, 2, 1] as CardLevel[]).map(level => (
            <div key={level} className="flex items-center gap-3 min-w-max">
              <DeckPile
                level={level}
                count={board.decks[level].length}
                onReserve={() => handleReserveFromDeck(level)}
                canReserve={currentPlayer.reservedCards.length < 3 && board.decks[level].length > 0}
              />
              {board.visibleCards[level].map((card, i) =>
                card ? (
                  <div key={card.id} className="relative group flex-shrink-0">
                    <GameCard
                      card={card}
                      isSelected={pendingCard?.id === card.id}
                      onCardClick={handleCardClick}
                      className={affordableIds.has(card.id) ? '' : 'opacity-35 cursor-not-allowed'}
                    />
                    {pendingCard?.id === card.id && (
                      <PurchaseOverlay onConfirm={confirmPurchase} onCancel={handleCancelPurchase} />
                    )}
                    {!pendingCard && (
                      <button
                        onClick={() => handleReserve(card)}
                        disabled={currentPlayer.reservedCards.length >= 3}
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 rounded-lg bg-zinc-700/90 hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-bold text-white whitespace-nowrap shadow-lg"
                      >
                        Reserve
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    key={i}
                    className="w-36 h-52 flex-shrink-0 rounded-xl border border-dashed border-white/10"
                  />
                )
              )}
            </div>
          ))}
        </div>

        {/* ── Bottom bar ────────────────────────────────────────────────── */}
        <div className="space-y-3 pt-4 border-t border-white/10">

          {discardMode ? (
            <DiscardPanel
              playerGems={currentPlayer.gems}
              toReturn={toReturn}
              mustReturn={mustReturn}
              onToggle={handleToggleReturn}
              onConfirm={handleConfirmReturn}
              onReset={handleResetReturn}
            />
          ) : (
            <div className="rounded-xl bg-gray-800/60 border border-white/10 backdrop-blur-sm px-4 py-3">
              <GemSupply gems={board.gems} pending={pending} onGemClick={handleGemClick} />
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 min-h-[36px]">
              {!discardMode && totalPending > 0 && (
                <>
                  <span className="text-sm text-gray-400">
                    Take {totalPending} gem{totalPending > 1 ? 's' : ''}
                    {totalHeld + totalPending > 10 && (
                      <span className="ml-1 text-yellow-400">(will need to return {totalHeld + totalPending - 10})</span>
                    )}
                  </span>
                  <button
                    onClick={handleTakeGems}
                    disabled={!isValidSelection}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={handleClearGems}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white/40 tabular-nums">
                {moveCount} move{moveCount !== 1 ? 's' : ''}
              </span>
              <span className="text-base font-bold text-yellow-300">
                {currentPlayer.name}'s turn
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
