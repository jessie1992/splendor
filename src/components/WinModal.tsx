import { useGameStore } from '../store'

export function WinModal() {
  const { phase, winners, players, initGame } = useGameStore()

  if (phase !== 'ended') return null

  const sorted  = [...players].sort((a, b) => b.score - a.score)
  const isTie   = winners.length > 1
  const winNames = winners.map(w => w.name).join(' & ')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm mx-4 bg-gray-900 border border-yellow-500/30 rounded-2xl shadow-2xl overflow-hidden">

        {/* Gold shimmer band */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/15 to-transparent pointer-events-none" />

        <div className="relative z-10 p-8 text-white">

          {/* Trophy + title */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-3 drop-shadow-lg">🏆</div>
            <h2 className="text-3xl font-black tracking-tight">
              {isTie ? "It's a Tie!" : 'Victory!'}
            </h2>
            <p className="text-yellow-400 font-semibold mt-1 text-lg">
              {winNames} {isTie ? 'are tied for first!' : 'wins!'}
            </p>
          </div>

          {/* Final scoreboard */}
          <div className="space-y-2 mb-7">
            {sorted.map((player, rank) => {
              const isWinner = winners.some(w => w.id === player.id)
              return (
                <div
                  key={player.id}
                  className={[
                    'flex items-center justify-between px-4 py-2.5 rounded-xl',
                    isWinner
                      ? 'bg-yellow-500/20 border border-yellow-500/50'
                      : 'bg-white/5 border border-transparent',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30 w-5 tabular-nums">#{rank + 1}</span>
                    <span className={`font-semibold ${isWinner ? 'text-yellow-300' : 'text-white'}`}>
                      {player.name}
                    </span>
                    {isWinner && (
                      <span className="text-xs bg-yellow-500/30 text-yellow-300 px-1.5 py-0.5 rounded-full font-bold">
                        ★
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-black text-xl tabular-nums ${isWinner ? 'text-yellow-400' : 'text-white'}`}>
                      {player.score}
                    </span>
                    <span className="text-xs text-white/30">pts</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Play again */}
          <button
            onClick={() => initGame(players.map(p => ({ name: p.name, isCpu: p.isCpu })))}
            className="w-full py-3.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-gray-900 font-black text-base transition-colors shadow-lg"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  )
}
