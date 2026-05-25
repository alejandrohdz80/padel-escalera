/**
 * Sistema de puntos normalizado por percentil.
 *
 * La posición de la cancha se convierte a un percentil 0.0–1.0
 * independientemente de cuántas canchas haya en la sesión.
 *
 *   Cancha 1 de 2  → percentil 1.0
 *   Cancha 1 de 10 → percentil 1.0  (siempre igual)
 *   Cancha 5 de 10 → percentil 0.56
 *   Última cancha  → percentil 0.0  (siempre igual)
 *
 * Puntos:
 *   Victoria: round(50 + 50 × percentil) → rango fijo [50, 100]
 *   Derrota:  round(10 + 10 × percentil) → rango fijo [10,  20]
 */
export function calculatePoints(
  courtNumber: number,
  numCourts: number,
  won: boolean
): number {
  const percentile = numCourts > 1
    ? (numCourts - courtNumber) / (numCourts - 1)
    : 1

  return won
    ? Math.round(50 + 50 * percentile)
    : Math.round(10 + 10 * percentile)
}

/**
 * Devuelve los puntos que gana cada jugador de una cancha
 * según qué equipo ganó.
 */
export function calculateCourtPoints(
  courtNumber: number,
  numCourts: number,
  winnerTeam: 1 | 2
): { team1Points: number; team2Points: number } {
  return {
    team1Points: calculatePoints(courtNumber, numCourts, winnerTeam === 1),
    team2Points: calculatePoints(courtNumber, numCourts, winnerTeam === 2),
  }
}

/**
 * Deriva el tipo de castigo (CAGUAMA/CUBETA/BOTELLA) de la razón.
 * El tipo NUNCA lo elige el usuario — siempre se calcula aquí.
 */
export const PENALTY_TYPES = {
  ULTIMO_EN_LLEGAR:    'CAGUAMA',
  DOBLE_FALTA:         'CAGUAMA',
  BOLITA_DON_ROBER:    'CAGUAMA',
  CERO_SEIS:           'CUBETA',
  REMONTAR_5_0_PERDER: 'BOTELLA',
  ABANICADA_REMATE:    'BOTELLA',
} as const

export type PenaltyReasonKey = keyof typeof PENALTY_TYPES
export type PenaltyTypeValue = typeof PENALTY_TYPES[PenaltyReasonKey]

export function getPenaltyType(reason: PenaltyReasonKey): PenaltyTypeValue {
  return PENALTY_TYPES[reason]
}
