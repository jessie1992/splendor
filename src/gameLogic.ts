import type { BoardState, Card, CardLevel, GameState, GemStash, Noble, Player, PurchasableGem } from './types'
import { GemColor } from './types'

// ── Action types ──────────────────────────────────────────────────────────────

export type DrawTokensAction =
  | { type: 'three-different'; colors: [PurchasableGem, PurchasableGem, PurchasableGem] }
  | { type: 'two-same'; color: PurchasableGem }

// ── Helpers ───────────────────────────────────────────────────────────────────

const PURCHASABLE_GEMS: PurchasableGem[] = [
  GemColor.White,
  GemColor.Blue,
  GemColor.Green,
  GemColor.Red,
  GemColor.Black,
]

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

/** Counts the permanent gem bonuses a player has from purchased cards. */
function getBonuses(player: Player): GemStash {
  const bonuses = emptyStash()
  for (const card of player.purchasedCards) {
    bonuses[card.bonus]++
  }
  return bonuses
}

// ── Pure game logic ───────────────────────────────────────────────────────────

/**
 * Returns true if the player can afford the card, taking into account
 * permanent bonuses from purchased cards and gold (wild) tokens.
 */
export function canAfford(player: Player, card: Card): boolean {
  const bonuses = getBonuses(player)
  let goldNeeded = 0

  for (const color of PURCHASABLE_GEMS) {
    const required      = card.cost[color] ?? 0
    const afterDiscount = Math.max(0, required - bonuses[color])
    const coveredByGems = Math.min(afterDiscount, player.gems[color])
    goldNeeded += afterDiscount - coveredByGems
  }

  return goldNeeded <= player.gems[GemColor.Gold]
}

/**
 * Returns the exact tokens the player must spend to purchase the card.
 * Bonuses are applied first; gold fills any remaining gap per color.
 * Only valid to call when canAfford returns true.
 */
export function calculateCost(player: Player, card: Card): GemStash {
  const bonuses = getBonuses(player)
  const payment = emptyStash()

  for (const color of PURCHASABLE_GEMS) {
    const required      = card.cost[color] ?? 0
    const afterDiscount = Math.max(0, required - bonuses[color])
    const tokensPaid    = Math.min(afterDiscount, player.gems[color])
    payment[color]          = tokensPaid
    payment[GemColor.Gold] += afterDiscount - tokensPaid
  }

  return payment
}

/**
 * Returns the subset of `nobles` that the player now qualifies for,
 * based on their purchased-card bonuses.
 */
export function checkNobles(player: Player, nobles: Noble[]): Noble[] {
  const bonuses = getBonuses(player)

  return nobles.filter(noble =>
    PURCHASABLE_GEMS.every(color => bonuses[color] >= (noble.requirement[color] ?? 0))
  )
}

// ── Board helpers (private) ───────────────────────────────────────────────────

function findOnBoard(board: BoardState, card: Card): { level: CardLevel; slotIndex: number } | null {
  for (const level of [1, 2, 3] as CardLevel[]) {
    const idx = board.visibleCards[level].findIndex(c => c?.id === card.id)
    if (idx !== -1) return { level, slotIndex: idx }
  }
  return null
}

function replaceSlot(board: BoardState, level: CardLevel, slotIndex: number): BoardState {
  const newDeck  = [...board.decks[level]]
  const newSlots = [...board.visibleCards[level]]
  newSlots[slotIndex] = newDeck.length > 0 ? (newDeck.shift() ?? null) : null
  return {
    ...board,
    visibleCards: { ...board.visibleCards, [level]: newSlots },
    decks:        { ...board.decks,        [level]: newDeck  },
  }
}

// ── Pure card actions ─────────────────────────────────────────────────────────

/**
 * Purchases `card` for `players[playerIndex]`.
 * - Applies permanent bonuses, fills remainder with gold.
 * - Returns tokens to supply.
 * - Replaces the card's board slot from the deck (no-op if reserved).
 * - Awards first qualifying noble (if any).
 * - Triggers lastRound if score ≥ 15 while phase is 'playing'.
 */
export function purchaseCard(state: GameState, playerIndex: number, card: Card): GameState {
  const player = state.players[playerIndex]
  if (!canAfford(player, card)) return state

  const payment    = calculateCost(player, card)
  const playerGems = { ...player.gems }
  const supplyGems = { ...state.board.gems }

  for (const color of Object.values(GemColor)) {
    const amount = payment[color]
    if (amount > 0) {
      playerGems[color] -= amount
      supplyGems[color] += amount
    }
  }

  const purchasedCards = [...player.purchasedCards, card]
  const reservedCards  = player.reservedCards.filter(c => c.id !== card.id)
  const cardScore      = player.score + card.score

  const provisional = { ...player, purchasedCards, gems: playerGems, score: cardScore }
  const earnedNoble = checkNobles(provisional, state.board.nobles)[0] ?? null
  const finalScore  = cardScore + (earnedNoble?.score ?? 0)

  const finalPlayer: Player = {
    ...player,
    gems:               playerGems,
    purchasedCards,
    reservedCards,
    faceDownReservedIds: player.faceDownReservedIds.filter(id => id !== card.id),
    nobles: earnedNoble ? [...player.nobles, earnedNoble] : player.nobles,
    score:  finalScore,
  }

  let newBoard: BoardState = {
    ...state.board,
    gems:   supplyGems,
    nobles: earnedNoble
      ? state.board.nobles.filter(n => n.id !== earnedNoble.id)
      : state.board.nobles,
  }

  const loc = findOnBoard(state.board, card)
  if (loc) newBoard = replaceSlot(newBoard, loc.level, loc.slotIndex)

  const triggered = finalScore >= 15 && state.phase === 'playing'

  return {
    ...state,
    players: state.players.map((p, i) => i === playerIndex ? finalPlayer : p),
    board:   newBoard,
    phase:                 triggered ? 'lastRound' : state.phase,
    triggeringPlayerIndex: triggered ? playerIndex : state.triggeringPlayerIndex,
  }
}

/**
 * Reserves the top card of `level`'s deck (face-down) for `players[playerIndex]`.
 * The card ID is recorded in `faceDownReservedIds` so other players cannot see it.
 * Awards 1 gold from supply if available and player holds < 10 tokens.
 */
export function reserveFromDeck(state: GameState, playerIndex: number, level: CardLevel): GameState {
  const player = state.players[playerIndex]
  if (player.reservedCards.length >= 3) return state

  const deck = [...state.board.decks[level]]
  if (deck.length === 0) return state

  const card    = deck.shift()!
  const playerGems = { ...player.gems }
  const supplyGems = { ...state.board.gems }

  const totalHeld = Object.values(playerGems).reduce((a, b) => a + b, 0)
  if (supplyGems[GemColor.Gold] > 0 && totalHeld < 10) {
    playerGems[GemColor.Gold]++
    supplyGems[GemColor.Gold]--
  }

  const updatedPlayer: Player = {
    ...player,
    gems:               playerGems,
    reservedCards:      [...player.reservedCards, card],
    faceDownReservedIds: [...player.faceDownReservedIds, card.id],
  }

  return {
    ...state,
    players: state.players.map((p, i) => i === playerIndex ? updatedPlayer : p),
    board: {
      ...state.board,
      gems:  supplyGems,
      decks: { ...state.board.decks, [level]: deck },
    },
  }
}

/**
 * Reserves `card` from the board for `players[playerIndex]`.
 * - Maximum 3 reserved cards per player.
 * - Awards 1 gold from supply if available and player holds < 10 tokens total.
 * - Replaces the board slot from the deck.
 */
export function reserveCard(state: GameState, playerIndex: number, card: Card): GameState {
  const player = state.players[playerIndex]
  if (player.reservedCards.length >= 3) return state

  const loc = findOnBoard(state.board, card)
  if (!loc) return state

  const playerGems = { ...player.gems }
  const supplyGems = { ...state.board.gems }

  const totalHeld = Object.values(playerGems).reduce((a, b) => a + b, 0)
  if (supplyGems[GemColor.Gold] > 0 && totalHeld < 10) {
    playerGems[GemColor.Gold]++
    supplyGems[GemColor.Gold]--
  }

  const updatedPlayer: Player = {
    ...player,
    gems:          playerGems,
    reservedCards: [...player.reservedCards, card],
  }

  let newBoard = { ...state.board, gems: supplyGems }
  newBoard = replaceSlot(newBoard, loc.level, loc.slotIndex)

  return {
    ...state,
    players: state.players.map((p, i) => i === playerIndex ? updatedPlayer : p),
    board:   newBoard,
  }
}

/**
 * Returns a new GameState after the current player takes tokens.
 *
 * Valid actions:
 *   three-different — take 1 each of 3 distinct colors (each must have ≥ 1 in supply)
 *   two-same        — take 2 of 1 color (that color must have ≥ 4 in supply)
 *
 * Throws on invalid actions (wrong color count, insufficient supply, gold targeted).
 */
export function drawTokens(state: GameState, action: DrawTokensAction): GameState {
  const supplyGems  = { ...state.board.gems }
  const player      = state.players[state.currentPlayerIndex]
  const playerGems  = { ...player.gems }

  if (action.type === 'three-different') {
    const { colors } = action

    if (new Set(colors).size !== 3) {
      throw new Error('three-different requires exactly 3 distinct colors')
    }
    for (const color of colors) {
      if ((color as GemColor) === GemColor.Gold) {
        throw new Error('Gold cannot be taken by drawing tokens')
      }
      if (supplyGems[color] < 1) {
        throw new Error(`Supply has no ${color} tokens`)
      }
    }

    for (const color of colors) {
      supplyGems[color]--
      playerGems[color]++
    }
  } else {
    const { color } = action

    if ((color as GemColor) === GemColor.Gold) {
      throw new Error('Gold cannot be taken by drawing tokens')
    }
    if (supplyGems[color] < 4) {
      throw new Error(
        `Need ≥ 4 ${color} tokens to take 2 same (supply has ${supplyGems[color]})`
      )
    }

    supplyGems[color] -= 2
    playerGems[color] += 2
  }

  const updatedPlayer: Player = { ...player, gems: playerGems }
  const updatedPlayers = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? updatedPlayer : p
  )

  return {
    ...state,
    players: updatedPlayers,
    board: { ...state.board, gems: supplyGems },
  }
}
