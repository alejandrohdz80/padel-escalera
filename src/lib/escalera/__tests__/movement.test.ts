import { describe, it, expect } from 'vitest'
import { calculateNextRound, CourtResult } from '../movement'

const p = (id: string) => ({ id, name: id })

describe('calculateNextRound', () => {
  it('ganadores suben de cancha y perdedores bajan (caso normal)', () => {
    const results: CourtResult[] = [
      { courtNumber: 1, team1: [p('A'), p('B')], team2: [p('C'), p('D')], winnerTeam: 1 },
      { courtNumber: 2, team1: [p('E'), p('F')], team2: [p('G'), p('H')], winnerTeam: 1 },
    ]
    const next = calculateNextRound(results, 2, 'FIXED_PAIRS')

    // Cancha 1 siguiente: A,B (ganadores cancha 1 se quedan) + E,F (ganadores cancha 2 suben)
    const court1 = next.find(c => c.courtNumber === 1)!
    const court1Players = [...court1.team1, ...court1.team2].map(p => p.id).sort()
    expect(court1Players).toEqual(['A', 'B', 'E', 'F'].sort())

    // Cancha 2 siguiente: C,D (perdedores cancha 1 bajan) + G,H (perdedores cancha 2 se quedan)
    const court2 = next.find(c => c.courtNumber === 2)!
    const court2Players = [...court2.team1, ...court2.team2].map(p => p.id).sort()
    expect(court2Players).toEqual(['C', 'D', 'G', 'H'].sort())
  })

  it('ganadores de cancha 1 se quedan en cancha 1', () => {
    const results: CourtResult[] = [
      { courtNumber: 1, team1: [p('A'), p('B')], team2: [p('C'), p('D')], winnerTeam: 1 },
      { courtNumber: 2, team1: [p('E'), p('F')], team2: [p('G'), p('H')], winnerTeam: 2 },
    ]
    const next = calculateNextRound(results, 2, 'FIXED_PAIRS')
    const court1 = next.find(c => c.courtNumber === 1)!
    const ids = [...court1.team1, ...court1.team2].map(p => p.id)
    expect(ids).toContain('A')
    expect(ids).toContain('B')
  })

  it('perdedores de última cancha se quedan en última cancha', () => {
    const results: CourtResult[] = [
      { courtNumber: 1, team1: [p('A'), p('B')], team2: [p('C'), p('D')], winnerTeam: 1 },
      { courtNumber: 2, team1: [p('E'), p('F')], team2: [p('G'), p('H')], winnerTeam: 1 },
    ]
    const next = calculateNextRound(results, 2, 'FIXED_PAIRS')
    const court2 = next.find(c => c.courtNumber === 2)!
    const ids = [...court2.team1, ...court2.team2].map(p => p.id)
    expect(ids).toContain('G')
    expect(ids).toContain('H')
  })

  it('devuelve el mismo número de canchas que la entrada', () => {
    const make = (n: number): CourtResult[] =>
      Array.from({ length: n }, (_, i) => ({
        courtNumber: i + 1,
        team1: [p(`${i}A`), p(`${i}B`)],
        team2: [p(`${i}C`), p(`${i}D`)],
        winnerTeam: 1 as const,
      }))

    expect(calculateNextRound(make(2), 2, 'RANDOM_PAIRS')).toHaveLength(2)
    expect(calculateNextRound(make(5), 5, 'RANDOM_PAIRS')).toHaveLength(5)
    expect(calculateNextRound(make(10), 10, 'RANDOM_PAIRS')).toHaveLength(10)
  })

  it('cada cancha tiene exactamente 4 jugadores únicos', () => {
    const results: CourtResult[] = Array.from({ length: 4 }, (_, i) => ({
      courtNumber: i + 1,
      team1: [p(`${i}A`), p(`${i}B`)],
      team2: [p(`${i}C`), p(`${i}D`)],
      winnerTeam: 1 as const,
    }))
    const next = calculateNextRound(results, 4, 'RANDOM_PAIRS')
    for (const court of next) {
      const ids = [...court.team1, ...court.team2].map(p => p.id)
      expect(ids).toHaveLength(4)
      expect(new Set(ids).size).toBe(4)
    }
  })
})
