// ── Gems ────────────────────────────────────────────────────────────────────

export enum GemColor {
  White  = 'white',   // Diamond
  Blue   = 'blue',    // Sapphire
  Green  = 'green',   // Emerald
  Red    = 'red',     // Ruby
  Black  = 'black',   // Onyx
  Gold   = 'gold',    // Wild / joker — only from reserved-card bonus
}

/** The five purchasable gem colors (excludes Gold). */
export type PurchasableGem = Exclude<GemColor, GemColor.Gold>

// ── Core value types ─────────────────────────────────────────────────────────

/** A mapping of gem colors to quantities (0 means absent). */
export type GemStash = Record<GemColor, number>

/** The gem cost to purchase a card (never contains Gold). */
export type Cost = Partial<Record<PurchasableGem, number>>

// ── Cards ────────────────────────────────────────────────────────────────────

export type CardLevel = 1 | 2 | 3

export interface Card {
  id: string
  level: CardLevel
  /** Prestige points awarded when purchased (0 for most level-1 cards). */
  score: number
  /** The permanent gem discount this card provides after purchase. */
  bonus: PurchasableGem
  cost: Cost
}

// ── Nobles ───────────────────────────────────────────────────────────────────

export interface Noble {
  id: string
  /** Always 3 prestige points in standard Splendor. */
  score: number
  /** Required purchased-card bonuses to attract this noble. */
  requirement: Partial<Record<PurchasableGem, number>>
}

// ── Players ──────────────────────────────────────────────────────────────────

export interface Player {
  id: string
  name: string
  isCpu: boolean
  /** Loose gems held in hand (max 10 total). */
  gems: GemStash
  /** Cards the player has purchased (contributes bonuses + score). */
  purchasedCards: Card[]
  /** Cards held in reserve, not yet purchased (max 3). */
  reservedCards: Card[]
  /** IDs of reserved cards taken from a deck (hidden from other players). */
  faceDownReservedIds: string[]
  /** Nobles the player has attracted. */
  nobles: Noble[]
  /** Cached prestige total (sum of card + noble scores). */
  score: number
}

// ── Board ────────────────────────────────────────────────────────────────────

export type DeckByLevel = Record<CardLevel, Card[]>

export interface BoardState {
  /** Remaining face-down cards per level. */
  decks: DeckByLevel
  /** The four face-up cards per level. */
  visibleCards: Record<CardLevel, Array<Card | null>>
  /** Gem tokens available in the supply. */
  gems: GemStash
  /** Nobles still available on the board. */
  nobles: Noble[]
}

// ── Game state ───────────────────────────────────────────────────────────────

export type GamePhase = 'setup' | 'playing' | 'lastRound' | 'ended'

export interface GameState {
  players: Player[]
  /** Index into `players` for whose turn it is. */
  currentPlayerIndex: number
  board: BoardState
  phase: GamePhase
  /** Index of the player who triggered the final round (reached 15 pts), or null. */
  triggeringPlayerIndex: number | null
  /** Winner(s) after the game ends (ties are possible). */
  winners: Player[]
  /** Total number of turns taken across all players. */
  moveCount: number
}
