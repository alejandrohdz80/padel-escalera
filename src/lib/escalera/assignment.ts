import { SessionMode } from '@/generated/prisma/client'
import { PlayerRef, assignPairs, CourtTeams } from './pairing'

const CATEGORY_ORDER: Record<string, number> = {
  '1a': 1,
  '2a': 2,
  '3a': 3,
  '4a': 4,
  'Open': 5,
}

export interface InitialAssignment {
  courtNumber: number
  team1: [PlayerRef, PlayerRef]
  team2: [PlayerRef, PlayerRef]
}

/**
 * Asignación inicial de canchas.
 * Ordena jugadores por categoría (mejor → peor) y los distribuye:
 *   Cancha 1 = mejores 4 jugadores
 *   Cancha N = peores 4 jugadores
 *
 * Requiere exactamente numCourts × 4 jugadores.
 */
export function createInitialAssignment(
  players: (PlayerRef & { category: string })[],
  numCourts: number,
  mode: SessionMode
): InitialAssignment[] {
  if (players.length !== numCourts * 4) {
    throw new Error(
      `Se necesitan exactamente ${numCourts * 4} jugadores para ${numCourts} canchas. Hay ${players.length}.`
    )
  }

  // Ordenar por categoría (mejor primero), con shuffle dentro de la misma categoría
  const sorted = [...players].sort((a, b) => {
    const diff =
      (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99)
    return diff !== 0 ? diff : Math.random() - 0.5
  })

  const assignments: InitialAssignment[] = []

  for (let court = 1; court <= numCourts; court++) {
    const group = sorted.slice((court - 1) * 4, court * 4) as [
      PlayerRef & { category: string },
      PlayerRef & { category: string },
      PlayerRef & { category: string },
      PlayerRef & { category: string },
    ]

    const teams = assignPairs(group, mode)
    assignments.push({ courtNumber: court, ...teams })
  }

  return assignments
}
