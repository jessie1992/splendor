import { create } from 'zustand'
import { GemColor } from './types'
import type { Card, CardLevel, GameState, GemStash, Noble, Player } from './types'
import { ALL_GENERATED_CARDS as ALL_CARDS } from './data/CardGenerator'
import { ALL_NOBLES } from './data/cards'
import { purchaseCard as applyPurchase, reserveCard as applyReserve, reserveFromDeck as applyReserveFromDeck, applyDrawTokens } from './gameLogic'
import { computeAiAction } from './ai'

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function emptyStash(): GemStash {
  return {
    [GemColor.White]: 0,
    [GemColor.Blue]:  0,
    [GemColor.Green]: 0,
    [GemColor.Red]:   0,
    [GemColor.Black]: 0,
    [GemColor.Gold]:  0,
  }
}

function makePlayer(index: number, name: string, isCpu: boolean): Player {
  return {
    id: `player-${index}`,
    name,
    isCpu,
    gems: emptyStash(),
    purchasedCards: [],
    reservedCards: [],
    faceDownReservedIds: [],
    nobles: [],
    score: 0,
  }
}

/** Gem tokens per non-gold color based on player count (Splendor rules). */
const GEM_COUNTS: Record<number, number> = { 2: 4, 3: 5, 4: 7 }
const GOLD_COUNT = 5

// ── Initial placeholder state (before initGame) ───────────────────────────────

const EMPTY_VISIBLE = [null, null, null, null] as Array<Card | null>

const emptyGameState: GameState = {
  players: [],
  currentPlayerIndex: 0,
  board: {
    decks:        { 1: [], 2: [], 3: [] },
    visibleCards: { 1: [...EMPTY_VISIBLE], 2: [...EMPTY_VISIBLE], 3: [...EMPTY_VISIBLE] },
    gems:         emptyStash(),
    nobles:       [],
  },
  phase: 'setup',
  triggeringPlayerIndex: null,
  winners: [],
}

// ── Store ─────────────────────────────────────────────────────────────────────

export type GameStore = GameState & {
  /**
   * Shuffles all three tiers, deals 4 face-up cards per row, distributes
   * gem tokens according to player count, and places (playerCount + 1) nobles.
   */
  initGame: (players: { name: string; isCpu: boolean }[]) => void

  /**
   * Takes gem tokens for the current player.
   * Pass an array of colors to take (duplicates allowed for "take 2 same"):
   *   [white, blue, green]  → take 1 each of 3 different colors
   *   [blue, blue]          → take 2 blue (supply must have ≥ 4)
   * Silently returns on invalid input.
   */
  drawTokens: (colors: GemColor[]) => void

  /**
   * Attempts to purchase `card` for the current player.
   * - Silently returns if the player cannot afford it.
   * - Deducts gems (applying permanent bonuses and gold as wild).
   * - Draws the top of the matching deck into the vacated slot.
   * - Awards the first qualifying noble (if any).
   * - Sets phase → 'lastRound' if the player reaches 15 prestige points.
   */
  purchaseCard: (card: Card) => void

  /**
   * Reserves `card` from the board for the current player (max 3 reserved).
   * Awards 1 gold if supply has any and the player holds fewer than 10 tokens.
   */
  reserveCard: (card: Card) => void

  /**
   * Reserves the top card of `level`'s deck (face-down) for the current player.
   * The card is hidden from other players but visible to its owner.
   * Awards 1 gold if available and the player holds fewer than 10 tokens.
   */
  reserveFromDeck: (level: CardLevel) => void

  /**
   * Advances to the next player. If we are already in the 'lastRound' phase
   * and the round has completed (index wraps back to 0), the game ends and
   * winners are determined (highest score; fewest purchased cards as tiebreaker).
   */
  nextTurn: () => void

  /**
   * Computes and applies one AI move for the current player, then advances
   * the turn — all in a single atomic state update.
   * No-op if the current player is human or the game is not active.
   */
  doAiTurn: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...emptyGameState,

  initGame: (playerDefs: { name: string; isCpu: boolean }[]) => {
    const n = playerDefs.length
    if (n < 2 || n > 4) throw new Error('Splendor requires 2–4 players')

    // Shuffle each tier independently
    const deck1 = shuffle(ALL_CARDS.filter(c => c.level === 1))
    const deck2 = shuffle(ALL_CARDS.filter(c => c.level === 2))
    const deck3 = shuffle(ALL_CARDS.filter(c => c.level === 3))

    // Deal 4 face-up cards per row (mutates the local copies)
    const deal = (deck: Card[]): [Array<Card | null>, Card[]] => {
      const visible: Array<Card | null> = deck.splice(0, 4)
      return [visible, deck]
    }

    const [vis1, rem1] = deal(deck1)
    const [vis2, rem2] = deal(deck2)
    const [vis3, rem3] = deal(deck3)

    // Gem supply
    const gemCount = GEM_COUNTS[n]
    const gems: GemStash = {
      [GemColor.White]: gemCount,
      [GemColor.Blue]:  gemCount,
      [GemColor.Green]: gemCount,
      [GemColor.Red]:   gemCount,
      [GemColor.Black]: gemCount,
      [GemColor.Gold]:  GOLD_COUNT,
    }

    // Place (playerCount + 1) random nobles
    const nobles: Noble[] = shuffle(ALL_NOBLES).slice(0, n + 1)

    const players = playerDefs.map((p, i) => makePlayer(i, p.name, p.isCpu))

    set({
      players,
      currentPlayerIndex: 0,
      phase: 'playing',
      triggeringPlayerIndex: null,
      winners: [],
      board: {
        decks:        { 1: rem1, 2: rem2, 3: rem3 } as Record<CardLevel, Card[]>,
        visibleCards: { 1: vis1, 2: vis2, 3: vis3 },
        gems,
        nobles,
      },
    })
  },

  drawTokens: (colors: GemColor[]) => {
    if (colors.length === 0 || colors.length > 3) return
    const { players, currentPlayerIndex, board } = get()
    const player     = players[currentPlayerIndex]
    const playerGems = { ...player.gems }
    const supplyGems = { ...board.gems }

    // 10-token cap
    const totalHeld = Object.values(player.gems).reduce((a, b) => a + b, 0)
    if (totalHeld + colors.length > 10) return

    const isDoubleSame = colors.length === 2 && colors[0] === colors[1]

    if (isDoubleSame) {
      // Two-same: supply must have ≥ 4
      if (supplyGems[colors[0]] < 4) return
    } else {
      // Different colors: no duplicates, each must be available, no gold
      if (new Set(colors).size !== colors.length) return
      for (const c of colors) {
        if (c === GemColor.Gold || supplyGems[c] < 1) return
      }
    }

    for (const c of colors) {
      playerGems[c]++
      supplyGems[c]--
    }

    set({
      players: players.map((p, i) =>
        i === currentPlayerIndex ? { ...p, gems: playerGems } : p
      ),
      board: { ...board, gems: supplyGems },
    })
  },

  purchaseCard: (card: Card) => {
    const state = get()
    set(applyPurchase(state, state.currentPlayerIndex, card))
  },

  reserveCard: (card: Card) => {
    const state = get()
    set(applyReserve(state, state.currentPlayerIndex, card))
  },

  reserveFromDeck: (level: CardLevel) => {
    const state = get()
    set(applyReserveFromDeck(state, state.currentPlayerIndex, level))
  },

  nextTurn: () => {
    const state = get()
    const n = state.players.length
    const nextIndex = (state.currentPlayerIndex + 1) % n

    // Completing the final round: wrap back to player 0 while in lastRound
    if (state.phase === 'lastRound' && nextIndex === 0) {
      const maxScore = Math.max(...state.players.map(p => p.score))
      const leaders  = state.players.filter(p => p.score === maxScore)
      // Tiebreaker: fewest purchased cards
      const minCards = Math.min(...leaders.map(p => p.purchasedCards.length))
      const winners  = leaders.filter(p => p.purchasedCards.length === minCards)

      set({ currentPlayerIndex: nextIndex, phase: 'ended', winners })
      return
    }

    set({ currentPlayerIndex: nextIndex })
  },

  doAiTurn: () => {
    const state = get()
    const { phase, currentPlayerIndex } = state
    if (phase !== 'playing' && phase !== 'lastRound') return
    const player = state.players[currentPlayerIndex]
    if (!player.isCpu) return

    // Compute action and apply it — pure function, no intermediate set()
    const action = computeAiAction(state, currentPlayerIndex)
    let next: GameState = state

    switch (action.type) {
      case 'purchase':
        next = applyPurchase(state, currentPlayerIndex, action.card)
        break
      case 'reserve':
        next = applyReserve(state, currentPlayerIndex, action.card)
        break
      case 'reserveFromDeck':
        next = applyReserveFromDeck(state, currentPlayerIndex, action.level)
        break
      case 'drawTokens':
        if (action.colors.length > 0)
          next = applyDrawTokens(state, action.colors)
        break
    }

    // Advance turn atomically in the same set()
    const n = next.players.length
    const nextIndex = (currentPlayerIndex + 1) % n

    if (next.phase === 'lastRound' && nextIndex === 0) {
      const maxScore = Math.max(...next.players.map(p => p.score))
      const leaders  = next.players.filter(p => p.score === maxScore)
      const minCards = Math.min(...leaders.map(p => p.purchasedCards.length))
      const winners  = leaders.filter(p => p.purchasedCards.length === minCards)
      set({ ...next, currentPlayerIndex: nextIndex, phase: 'ended', winners })
    } else {
      set({ ...next, currentPlayerIndex: nextIndex })
    }
  },
}))
