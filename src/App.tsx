import { useState } from 'react'
import { useGameStore } from './store'
import { Board } from './components/Board'
import { WinModal } from './components/WinModal'

// ── Setup screen ──────────────────────────────────────────────────────────────

function SetupScreen() {
  const initGame = useGameStore(s => s.initGame)
  const [count, setCount]   = useState(2)
  const [names, setNames]   = useState(['Alice', 'Bob', 'Charlie', 'Dave'])

  const setName = (i: number, value: string) => {
    const updated = [...names]
    updated[i] = value
    setNames(updated)
  }

  const canStart = names.slice(0, count).every(n => n.trim().length > 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-8 p-8">

      {/* Title */}
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-wide text-yellow-400">Splendor</h1>
        <p className="text-gray-500 mt-2 text-sm">A game of gem trading and noble patronage</p>
      </div>

      {/* Setup card */}
      <div className="w-full max-w-xs bg-gray-900 rounded-2xl p-6 border border-white/10 space-y-5">

        {/* Player count selector */}
        <div>
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest block mb-2">
            Players
          </label>
          <div className="flex gap-2">
            {[2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={[
                  'flex-1 py-2 rounded-lg font-bold text-sm transition-colors',
                  count === n
                    ? 'bg-yellow-500 text-gray-900'
                    : 'bg-white/10 text-white hover:bg-white/20',
                ].join(' ')}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Name inputs */}
        <div className="space-y-2">
          {Array.from({ length: count }, (_, i) => (
            <input
              key={i}
              value={names[i]}
              onChange={e => setName(i, e.target.value)}
              placeholder={`Player ${i + 1}`}
              className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 border border-white/10 focus:border-yellow-500/50 focus:outline-none transition-colors"
            />
          ))}
        </div>

        {/* Start button */}
        <button
          disabled={!canStart}
          onClick={() => initGame(names.slice(0, count).map(n => n.trim()))}
          className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 font-black text-base transition-colors shadow-lg"
        >
          Start Game
        </button>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

function App() {
  const phase = useGameStore(s => s.phase)

  return (
    <>
      {phase === 'setup' ? <SetupScreen /> : <Board />}
      <WinModal />
    </>
  )
}

export default App
