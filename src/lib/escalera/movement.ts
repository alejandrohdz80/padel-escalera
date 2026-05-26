import { SessionMode } from '@/generated/prisma/client'
import { PlayerRef, assignPairs } from './pairing'

export interface CourtResult {
  courtNumber: number
  team1: [PlayerRef, PlayerRef]
  team2: [PlayerRef, PlayerRef]
  winnerTeam: 1 | 2
}

export interface NextRoundCourt {
  courtNumber: number
  team1: [PlayerRef, PlayerRef]
  team2: [PlayerRef, PlayerRef]
}

/**
 * Calcula la distribución de jugadores para la siguiente ronda.
 *
 * Reglas escalera:
 *   - Par ganador de cancha N → cancha N-1 (si N > 1, si no se queda)
 *   - Par perdedor de cancha N → cancha N+1 (si N < numCourts, si no se queda)
 *
 * Luego asigna parejas según el modo:
 *   FIXED_PAIRS  → el par que llegó junto se mantiene como equipo
 *   RANDOM_PAIRS → los 4 jugadores de la nueva cancha se sortean al azar
 */
export function calculateNextRound(
  results: CourtResult[],
  numCourts: number,
  mode: SessionMode
): NextRoundCourt[] {
  // Ordenar por cancha para procesarlas en orden
  const sorted = [...results].sort((a, b) => a.courtNumber - b.courtNumber)

  // Para cada cancha, extraer par ganador y par perdedor
  const winners: Map<number, [PlayerRef, PlayerRef]> = new Map()
  const losers: Map<number, [PlayerRef, PlayerRef]> = new Map()

  for (const r of sorted) {
    const winner: [PlayerRef, PlayerRef] = r.winnerTeam === 1 ? r.team1 : r.team2
    const loser: [PlayerRef, PlayerRef] = r.winnerTeam === 1 ? r.team2 : r.team1
    winners.set(r.courtNumber, winner)
    losers.set(r.courtNumber, loser)
  }

  const nextCourts: NextRoundCourt[] = []

  for (let court = 1; court <= numCourts; court++) {
    // Quiénes llegan a esta cancha en la siguiente ronda:
    //   - Ganadores de esta cancha se quedan (si es cancha 1)
    //     ó  Ganadores de la cancha de abajo (court+1) suben
    //   - Perdedores de esta cancha se quedan (si es cancha N)
    //     ó  Perdedores de la cancha de arriba (court-1) bajan

    // Quiénes bajan a esta cancha (vienen de la cancha superior):
    //   Cancha 1: los ganadores de cancha 1 se QUEDAN (no hay cancha superior)
    //   Resto:    los perdedores de la cancha N-1 bajan
    const comingDown: [PlayerRef, PlayerRef] =
      court === 1
        ? winners.get(1)!          // cancha 1: ganadores se quedan
        : losers.get(court - 1)!   // perdedores de cancha superior bajan

    // Quiénes suben a esta cancha (vienen de la cancha inferior):
    //   Última cancha: los perdedores de última cancha se QUEDAN
    //   Resto:         los ganadores de la cancha N+1 suben
    const comingUp: [PlayerRef, PlayerRef] =
      court === numCourts
        ? losers.get(numCourts)!   // última cancha: perdedores se quedan
        : winners.get(court + 1)!  // ganadores de cancha inferior suben

    // Los 4 jugadores de la nueva cancha
    const fourPlayers: [PlayerRef, PlayerRef, PlayerRef, PlayerRef] = [
      comingUp[0],
      comingUp[1],
      comingDown[0],
      comingDown[1],
    ]

    const teams = assignPairs(fourPlayers, mode)
    nextCourts.push({ courtNumber: court, ...teams })
  }

  return nextCourts
}
