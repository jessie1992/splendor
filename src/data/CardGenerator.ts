import type { Card, CardLevel, PurchasableGem } from '../types'
import { GemColor } from '../types'

// ── Raw JSON shape ────────────────────────────────────────────────────────────

const VALID_PURCHASABLE = new Set<string>([
  GemColor.White, GemColor.Blue, GemColor.Green, GemColor.Red, GemColor.Black,
])

export interface RawCard {
  id:         string
  tier:       1 | 2 | 3
  score:      number
  bonusColor: string
  cost:       Partial<Record<string, number>>
}

// ── Transformer ───────────────────────────────────────────────────────────────

function assertPurchasable(value: string, context: string): PurchasableGem {
  if (!VALID_PURCHASABLE.has(value)) {
    throw new Error(`CardGenerator: invalid color "${value}" in ${context}`)
  }
  return value as PurchasableGem
}

export function parseCards(raw: RawCard[]): Card[] {
  return raw.map(r => {
    const bonus  = assertPurchasable(r.bonusColor, `card ${r.id} bonusColor`)
    const level  = r.tier as CardLevel

    const cost: Partial<Record<PurchasableGem, number>> = {}
    for (const [colorStr, amount] of Object.entries(r.cost)) {
      if (!amount || amount <= 0) continue
      cost[assertPurchasable(colorStr, `card ${r.id} cost`)] = amount
    }

    return { id: r.id, level, score: r.score, bonus, cost }
  })
}

// ── Loaders (add tier2 / tier3 imports here as they become available) ─────────

import tier1Raw from './tier1Cards.json'
import tier2Raw from './tier2Cards.json'
import tier3Raw from './tier3Cards.json'

export const TIER1_CARDS: Card[] = parseCards(tier1Raw as RawCard[])
export const TIER2_CARDS: Card[] = parseCards(tier2Raw as RawCard[])
export const TIER3_CARDS: Card[] = parseCards(tier3Raw as RawCard[])

export const ALL_GENERATED_CARDS: Card[] = [
  ...TIER1_CARDS,
  ...TIER2_CARDS,
  ...TIER3_CARDS,
]
