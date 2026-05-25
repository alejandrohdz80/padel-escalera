import { describe, it, expect } from 'vitest'
import { calculatePoints, getPenaltyType } from '../points'

describe('calculatePoints', () => {
  it('cancha 1 siempre da 100 pts en victoria sin importar numCourts', () => {
    expect(calculatePoints(1, 2, true)).toBe(100)
    expect(calculatePoints(1, 5, true)).toBe(100)
    expect(calculatePoints(1, 10, true)).toBe(100)
  })

  it('última cancha siempre da 50 pts en victoria sin importar numCourts', () => {
    expect(calculatePoints(2, 2, true)).toBe(50)
    expect(calculatePoints(5, 5, true)).toBe(50)
    expect(calculatePoints(10, 10, true)).toBe(50)
  })

  it('cancha 1 siempre da 20 pts en derrota', () => {
    expect(calculatePoints(1, 2, false)).toBe(20)
    expect(calculatePoints(1, 10, false)).toBe(20)
  })

  it('última cancha siempre da 10 pts en derrota', () => {
    expect(calculatePoints(2, 2, false)).toBe(10)
    expect(calculatePoints(10, 10, false)).toBe(10)
  })

  it('victoria siempre supera a derrota en la misma cancha', () => {
    for (let courts = 2; courts <= 10; courts++) {
      for (let court = 1; court <= courts; court++) {
        expect(calculatePoints(court, courts, true)).toBeGreaterThan(
          calculatePoints(court, courts, false)
        )
      }
    }
  })

  it('cancha mejor da más puntos que cancha peor', () => {
    expect(calculatePoints(1, 10, true)).toBeGreaterThan(
      calculatePoints(5, 10, true)
    )
    expect(calculatePoints(5, 10, true)).toBeGreaterThan(
      calculatePoints(10, 10, true)
    )
  })

  it('rango de victorias siempre entre 50 y 100', () => {
    for (let courts = 2; courts <= 10; courts++) {
      for (let court = 1; court <= courts; court++) {
        const pts = calculatePoints(court, courts, true)
        expect(pts).toBeGreaterThanOrEqual(50)
        expect(pts).toBeLessThanOrEqual(100)
      }
    }
  })

  it('rango de derrotas siempre entre 10 y 20', () => {
    for (let courts = 2; courts <= 10; courts++) {
      for (let court = 1; court <= courts; court++) {
        const pts = calculatePoints(court, courts, false)
        expect(pts).toBeGreaterThanOrEqual(10)
        expect(pts).toBeLessThanOrEqual(20)
      }
    }
  })
})

describe('getPenaltyType', () => {
  it('deriva CAGUAMA correctamente', () => {
    expect(getPenaltyType('ULTIMO_EN_LLEGAR')).toBe('CAGUAMA')
    expect(getPenaltyType('DOBLE_FALTA')).toBe('CAGUAMA')
    expect(getPenaltyType('BOLITA_DON_ROBER')).toBe('CAGUAMA')
  })

  it('deriva CUBETA correctamente', () => {
    expect(getPenaltyType('CERO_SEIS')).toBe('CUBETA')
  })

  it('deriva BOTELLA correctamente', () => {
    expect(getPenaltyType('REMONTAR_5_0_PERDER')).toBe('BOTELLA')
    expect(getPenaltyType('ABANICADA_REMATE')).toBe('BOTELLA')
  })
})
