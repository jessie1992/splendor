import { GemColor } from '../types'
import type { Card, CardLevel, Cost, Noble, PurchasableGem } from '../types'

const W = GemColor.White as PurchasableGem
const B = GemColor.Blue  as PurchasableGem
const G = GemColor.Green as PurchasableGem
const R = GemColor.Red   as PurchasableGem
const K = GemColor.Black as PurchasableGem

function card(id: string, level: CardLevel, score: number, bonus: PurchasableGem, cost: Cost): Card {
  return { id, level, score, bonus, cost }
}

// ── Level 1 — 40 cards (8 per bonus color) ───────────────────────────────────

const level1: Card[] = [
  // White bonus
  card('1w1', 1, 0, W, { [B]:1, [G]:1, [R]:1, [K]:1, [W]:1 }),
  card('1w2', 1, 0, W, { [B]:1, [G]:2, [R]:1 }),
  card('1w3', 1, 0, W, { [G]:1, [R]:2, [K]:1 }),
  card('1w4', 1, 0, W, { [B]:2, [G]:2 }),
  card('1w5', 1, 0, W, { [R]:2, [W]:1, [K]:1 }),
  card('1w6', 1, 0, W, { [K]:3 }),
  card('1w7', 1, 0, W, { [W]:1, [B]:1, [G]:3, [K]:1 }),
  card('1w8', 1, 1, W, { [R]:4 }),

  // Blue bonus
  card('1b1', 1, 0, B, { [W]:1, [B]:1, [G]:1, [R]:1, [K]:1 }),
  card('1b2', 1, 0, B, { [W]:1, [G]:1, [R]:2 }),
  card('1b3', 1, 0, B, { [W]:2, [B]:1, [K]:1 }),
  card('1b4', 1, 0, B, { [G]:2, [R]:2 }),
  card('1b5', 1, 0, B, { [W]:2, [K]:2 }),
  card('1b6', 1, 0, B, { [G]:3 }),
  card('1b7', 1, 0, B, { [W]:1, [B]:1, [G]:1, [K]:3 }),
  card('1b8', 1, 1, B, { [K]:4 }),

  // Green bonus
  card('1g1', 1, 0, G, { [W]:1, [B]:1, [G]:1, [R]:1, [K]:1 }),
  card('1g2', 1, 0, G, { [B]:1, [W]:2, [K]:1 }),
  card('1g3', 1, 0, G, { [B]:2, [R]:1, [K]:1 }),
  card('1g4', 1, 0, G, { [R]:2, [B]:2 }),
  card('1g5', 1, 0, G, { [W]:1, [B]:2, [K]:1 }),
  card('1g6', 1, 0, G, { [B]:3 }),
  card('1g7', 1, 0, G, { [W]:1, [B]:3, [G]:1, [R]:1 }),
  card('1g8', 1, 1, G, { [B]:4 }),

  // Red bonus
  card('1r1', 1, 0, R, { [W]:1, [B]:1, [G]:1, [R]:1, [K]:1 }),
  card('1r2', 1, 0, R, { [W]:2, [G]:1, [K]:1 }),
  card('1r3', 1, 0, R, { [B]:1, [G]:2, [W]:1 }),
  card('1r4', 1, 0, R, { [K]:2, [G]:2 }),
  card('1r5', 1, 0, R, { [W]:1, [B]:1, [G]:2 }),
  card('1r6', 1, 0, R, { [W]:3 }),
  card('1r7', 1, 0, R, { [R]:1, [G]:1, [K]:3, [B]:1 }),
  card('1r8', 1, 1, R, { [G]:4 }),

  // Black bonus
  card('1k1', 1, 0, K, { [W]:1, [B]:1, [G]:1, [R]:1, [K]:1 }),
  card('1k2', 1, 0, K, { [R]:2, [G]:1, [W]:1 }),
  card('1k3', 1, 0, K, { [R]:2, [G]:2 }),
  card('1k4', 1, 0, K, { [R]:2, [W]:2 }),
  card('1k5', 1, 0, K, { [G]:1, [R]:2, [K]:1 }),
  card('1k6', 1, 0, K, { [R]:3 }),
  card('1k7', 1, 0, K, { [W]:1, [G]:3, [K]:1, [R]:1 }),
  card('1k8', 1, 1, K, { [W]:4 }),
]

// ── Level 2 — 30 cards (6 per bonus color) ───────────────────────────────────

const level2: Card[] = [
  // White bonus
  card('2w1', 2, 1, W, { [G]:3, [R]:2, [K]:2 }),
  card('2w2', 2, 1, W, { [B]:3, [G]:2, [R]:3 }),
  card('2w3', 2, 2, W, { [G]:4, [B]:2, [R]:1 }),
  card('2w4', 2, 2, W, { [R]:5, [B]:3 }),
  card('2w5', 2, 2, W, { [K]:5, [G]:3 }),
  card('2w6', 2, 3, W, { [K]:6 }),

  // Blue bonus
  card('2b1', 2, 1, B, { [W]:2, [R]:3, [K]:2 }),
  card('2b2', 2, 1, B, { [W]:3, [G]:2, [K]:3 }),
  card('2b3', 2, 2, B, { [K]:4, [W]:2, [G]:1 }),
  card('2b4', 2, 2, B, { [G]:5, [R]:3 }),
  card('2b5', 2, 2, B, { [W]:5, [K]:3 }),
  card('2b6', 2, 3, B, { [W]:6 }),

  // Green bonus
  card('2g1', 2, 1, G, { [B]:2, [W]:2, [K]:3 }),
  card('2g2', 2, 1, G, { [B]:3, [W]:3, [R]:2 }),
  card('2g3', 2, 2, G, { [W]:4, [K]:2, [B]:1 }),
  card('2g4', 2, 2, G, { [K]:5, [B]:3 }),
  card('2g5', 2, 2, G, { [B]:5, [W]:3 }),
  card('2g6', 2, 3, G, { [B]:6 }),

  // Red bonus
  card('2r1', 2, 1, R, { [B]:3, [W]:2, [K]:2 }),
  card('2r2', 2, 1, R, { [B]:2, [G]:3, [W]:3 }),
  card('2r3', 2, 2, R, { [B]:4, [G]:2, [W]:1 }),
  card('2r4', 2, 2, R, { [W]:5, [G]:3 }),
  card('2r5', 2, 2, R, { [G]:5, [B]:3 }),
  card('2r6', 2, 3, R, { [G]:6 }),

  // Black bonus
  card('2k1', 2, 1, K, { [R]:3, [G]:2, [B]:2 }),
  card('2k2', 2, 1, K, { [R]:2, [W]:3, [G]:3 }),
  card('2k3', 2, 2, K, { [R]:4, [B]:2, [G]:1 }),
  card('2k4', 2, 2, K, { [G]:5, [R]:3 }),
  card('2k5', 2, 2, K, { [R]:5, [G]:3 }),
  card('2k6', 2, 3, K, { [R]:6 }),
]

// ── Level 3 — 20 cards (4 per bonus color) ───────────────────────────────────

const level3: Card[] = [
  // White bonus
  card('3w1', 3, 3, W, { [K]:3, [R]:3, [G]:3, [B]:5 }),
  card('3w2', 3, 4, W, { [K]:3, [R]:3, [B]:3, [G]:3 }),
  card('3w3', 3, 4, W, { [K]:7, [R]:3 }),
  card('3w4', 3, 5, W, { [K]:7, [R]:3, [G]:3 }),

  // Blue bonus
  card('3b1', 3, 3, B, { [W]:3, [R]:3, [G]:3, [K]:5 }),
  card('3b2', 3, 4, B, { [W]:6, [K]:3, [R]:3 }),
  card('3b3', 3, 4, B, { [W]:7, [R]:3 }),
  card('3b4', 3, 5, B, { [W]:7, [R]:3, [K]:3 }),

  // Green bonus
  card('3g1', 3, 3, G, { [B]:3, [W]:3, [K]:3, [R]:5 }),
  card('3g2', 3, 4, G, { [B]:6, [W]:3, [K]:3 }),
  card('3g3', 3, 4, G, { [B]:7, [W]:3 }),
  card('3g4', 3, 5, G, { [B]:7, [W]:3, [R]:3 }),

  // Red bonus
  card('3r1', 3, 3, R, { [G]:3, [B]:3, [W]:3, [K]:5 }),
  card('3r2', 3, 4, R, { [G]:6, [K]:3, [B]:3 }),
  card('3r3', 3, 4, R, { [G]:7, [K]:3 }),
  card('3r4', 3, 5, R, { [G]:7, [K]:3, [B]:3 }),

  // Black bonus
  card('3k1', 3, 3, K, { [R]:3, [W]:3, [B]:3, [G]:5 }),
  card('3k2', 3, 4, K, { [R]:6, [W]:3, [G]:3 }),
  card('3k3', 3, 4, K, { [R]:7, [G]:3 }),
  card('3k4', 3, 5, K, { [R]:7, [G]:3, [W]:3 }),
]

// ── Nobles — 10 tiles ────────────────────────────────────────────────────────

export const ALL_NOBLES: Noble[] = [
  { id: 'n1',  score: 3, requirement: { [W]:4, [R]:4 } },
  { id: 'n2',  score: 3, requirement: { [W]:4, [B]:4 } },
  { id: 'n3',  score: 3, requirement: { [B]:4, [G]:4 } },
  { id: 'n4',  score: 3, requirement: { [G]:4, [K]:4 } },
  { id: 'n5',  score: 3, requirement: { [R]:4, [K]:4 } },
  { id: 'n6',  score: 3, requirement: { [W]:3, [B]:3, [G]:3 } },
  { id: 'n7',  score: 3, requirement: { [W]:3, [R]:3, [K]:3 } },
  { id: 'n8',  score: 3, requirement: { [B]:3, [G]:3, [R]:3 } },
  { id: 'n9',  score: 3, requirement: { [G]:3, [R]:3, [K]:3 } },
  { id: 'n10', score: 3, requirement: { [W]:3, [B]:3, [K]:3 } },
]

export const ALL_CARDS: Card[] = [...level1, ...level2, ...level3]
