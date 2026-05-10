# Splendor Web

A browser-based implementation of the board game **Splendor**, built with Vite + React + TypeScript + Tailwind CSS + Zustand.

Developed by **Jessie**

---

## Features

- **2–4 players** — mix of human and CPU players
- **Heuristic AI** — CPU players evaluate cards, gems, and noble requirements to make smart decisions
- **Full Splendor rules**
  - Take 3 different gems, or 2 of the same (supply ≥ 4)
  - Over-10-token discard flow — choose which gems to return
  - Reserve cards from the board or face-down from deck tops
  - Purchase cards using gem bonuses + gold wildcards
  - Noble attraction after each purchase
  - Last-round trigger at 15 prestige points
  - Tiebreaker by fewest purchased cards
- **Move counter** — tracks total turns taken
- **Performance optimised** — atomic Zustand actions, React.memo, stable callbacks via useRef

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS v3 (JIT) |
| State | Zustand v5 |
| Package manager | Bun |

---

## Getting Started

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build
```

---

## Project Structure

```
src/
├── ai.ts               # Heuristic CPU player logic
├── gameLogic.ts        # Pure game-state functions (purchase, reserve, draw, etc.)
├── store.ts            # Zustand store — atomic actions, game lifecycle
├── types.ts            # TypeScript types (GameState, Player, Card, …)
├── data/
│   ├── cards.ts        # Noble tile definitions
│   ├── CardGenerator.ts
│   ├── tier1Cards.json
│   ├── tier2Cards.json
│   └── tier3Cards.json
└── components/
    ├── Board.tsx        # Main game board
    ├── GameCard.tsx     # Individual development card
    ├── GemIcon.tsx      # SVG gem icons
    └── WinModal.tsx     # End-game results screen
```

---

## Game Rules Summary

1. On your turn, do **one** of:
   - **Take gems** — 3 different colours, or 2 of the same (supply ≥ 4)
   - **Reserve a card** — from the board or deck top (max 3 held); receive 1 gold
   - **Purchase a card** — from the board or your reserve, using gems + card bonuses
2. If you exceed 10 tokens after taking, discard down to 10.
3. After purchasing, any noble whose requirements you meet visits automatically.
4. First player to reach **15 prestige points** triggers the final round.
5. The player with the most points wins. Ties broken by fewest purchased cards.
