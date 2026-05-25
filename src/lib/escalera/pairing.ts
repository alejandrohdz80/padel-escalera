import { SessionMode } from '@/generated/prisma'

export interface PlayerRef {
  id: string
  name: string
}

export interface CourtTeams {
  team1: [PlayerRef, PlayerRef]
  team2: [PlayerRef, PlayerRef]
}

/**
 * Dado un array de 4 jugadores, asigna 2 equipos según el modo:
 *
 * FIXED_PAIRS: los primeros 2 son Team 1, los últimos 2 son Team 2.
 *   El llamador es responsable de pasarlos en el orden correcto
 *   (par ganador + par perdedor que llegan a la nueva cancha).
 *
 * RANDOM_PAIRS: mezcla los 4 al azar y asigna 2 vs 2.
 */
export function assignPairs(
  players: [PlayerRef, PlayerRef, PlayerRef, PlayerRef],
  mode: SessionMode
): CourtTeams {
  if (mode === 'FIXED_PAIRS') {
    return {
      team1: [players[0], players[1]],
      team2: [players[2], players[3]],
    }
  }

  // RANDOM_PAIRS: shuffle y asignar
  const shuffled = shuffleArray([...players])
  return {
    team1: [shuffled[0], shuffled[1]],
    team2: [shuffled[2], shuffled[3]],
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
