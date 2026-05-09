/**
 * Splendor AI — heuristic-based agent
 *
 * Decision priority:
 *   1. Purchase the best affordable card (score + noble-completion bonus)
 *   2. Take up to 3 gems (always fills to 3 when possible; colours chosen by
 *      how much they reduce the "turns-to-afford" for the top-N target cards)
 *   3. Reserve a high-value card (level-3 first)
 *   4. Fallback: take any available gems
 */

import type { Card, CardLevel, GameState, GemStash, Noble, Player, PurchasableGem } from './types'
import { GemColor } from './types'
import { canAfford } from './gameLogic'

const PURCHASABLE: PurchasableGem[] = [
  GemColor.White, GemColor.Blue, GemColor.Green, GemColor.Red, GemColor.Black,
]

export type AiAction =
  | { type: 'purchase';        card:   Card      }
  | { type: 'reserve';         card:   Card      }
  | { type: 'reserveFromDeck'; level:  CardLevel }
  | { type: 'drawTokens';      colors: GemColor[] }

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBonuses(player: Player): GemStash {
  const b: GemStash = { white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0 }
  for (const card of player.purchasedCards) b[card.bonus]++
  return b
}

function allVisible(state: GameState): Card[] {
  const out: Card[] = []
  for (const lv of [1, 2, 3] as CardLevel[])
    for (const c of state.board.visibleCards[lv]) if (c) out.push(c)
  return out
}

/**
 * Minimum extra gems (not counting gold) needed to afford the card.
 * Returns 0 if already affordable.
 */
function shortfall(player: Player, card: Card): number {
  const bonuses = getBonuses(player)
  let gap = 0
  for (const color of PURCHASABLE) {
    const need = Math.max(0, (card.cost[color] ?? 0) - bonuses[color])
    gap += Math.max(0, need - player.gems[color])
  }
  return Math.max(0, gap - player.gems[GemColor.Gold])
}

/**
 * Heuristic value of purchasing / targeting a card.
 * Bonus points for cards that help complete a noble.
 */
function cardScore(card: Card, nobles: Noble[], player: Player): number {
  const bonuses = getBonuses(player)
  // Does this card's bonus help toward any noble?
  const nobleBonus = nobles.some(n => {
    const req = n.requirement[card.bonus] ?? 0
    return req > 0 && bonuses[card.bonus] < req
  }) ? 4 : 0
  const cost = Object.values(card.cost).reduce((a, b) => a + (b ?? 0), 0)
  return card.score * 10 + card.level * 3 + nobleBonus - cost * 0.5
}

/**
 * For a single colour, how much does taking 1 token reduce the total
 * shortfall across the top target cards?
 */
function gemBenefit(
  color: PurchasableGem,
  targets: Card[],
  player: Player,
): number {
  const bonuses = getBonuses(player)
  let benefit = 0
  for (const card of targets) {
    const need = Math.max(0, (card.cost[color] ?? 0) - bonuses[color])
    // Benefit = 1 if we're short on this colour for this card, else 0
    if (need > player.gems[color]) benefit += 1
  }
  return benefit
}

// ── Main decision function ────────────────────────────────────────────────────

export function computeAiAction(state: GameState, playerIndex: number): AiAction {
  const player   = state.players[playerIndex]
  const supply   = state.board.gems
  const nobles   = state.board.nobles
  const visible  = allVisible(state)
  const allCards = [...visible, ...player.reservedCards]
  const totalHeld = Object.values(player.gems).reduce((a, b) => a + b, 0)

  // ── 1. Purchase best affordable card ─────────────────────────────────────
  const affordable = allCards.filter(c => canAfford(player, c))
  if (affordable.length > 0) {
    const best = affordable
      .map(c => ({ c, v: cardScore(c, nobles, player) }))
      .sort((a, b) => b.v - a.v)[0].c
    return { type: 'purchase', card: best }
  }

  // ── 2. Take gems ──────────────────────────────────────────────────────────
  if (totalHeld < 10) {
    // Rank all visible cards by proximity + value → pick top 3 as targets
    const targets = visible
      .map(c => ({ c, sf: shortfall(player, c), v: cardScore(c, nobles, player) }))
      .sort((a, b) => a.sf !== b.sf ? a.sf - b.sf : b.v - a.v)
      .slice(0, 3)
      .map(x => x.c)

    // Score each available colour by how much it helps
    const colorScores = PURCHASABLE
      .filter(c => supply[c] >= 1)
      .map(c => ({ c, benefit: gemBenefit(c, targets, player) }))
      .sort((a, b) => b.benefit - a.benefit)

    if (colorScores.length > 0) {
      const budget   = Math.min(3, 10 - totalHeld)
      const top      = colorScores[0]

      // Try 2-same: top colour has high benefit, supply ≥ 4, budget allows
      if (top.benefit >= 2 && supply[top.c] >= 4 && budget >= 2) {
        return { type: 'drawTokens', colors: [top.c, top.c] }
      }

      // Take up to `budget` different colours — fill to 3 even with low-benefit colours
      const take = colorScores
        .slice(0, budget)
        .map(x => x.c)

      return { type: 'drawTokens', colors: take }
    }
  }

  // ── 3. Reserve a high-value card ──────────────────────────────────────────
  if (player.reservedCards.length < 3) {
    const ranked = visible
      .map(c => ({ c, v: cardScore(c, nobles, player) }))
      .sort((a, b) => b.v - a.v)
    // Prefer level-3
    const pick = ranked.find(x => x.c.level === 3)?.c ?? ranked[0]?.c
    if (pick) return { type: 'reserve', card: pick }

    for (const level of [3, 2, 1] as CardLevel[]) {
      if (state.board.decks[level].length > 0)
        return { type: 'reserveFromDeck', level }
    }
  }

  // ── 4. Fallback: take any gems ────────────────────────────────────────────
  if (totalHeld < 10) {
    const any = PURCHASABLE.filter(c => supply[c] > 0).slice(0, Math.min(3, 10 - totalHeld))
    if (any.length > 0) return { type: 'drawTokens', colors: any }
  }

  return { type: 'drawTokens', colors: [] }
}
