import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { calculateNextRound } from '@/lib/escalera/movement'
import type { CourtResult } from '@/lib/escalera/movement'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const admin = await prisma.player.findUnique({ where: { authId: user.id } })
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo admins' }, { status: 403 })
    }

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        rounds: {
          orderBy: { roundNumber: 'desc' },
          take: 1,
          include: {
            assignments: {
              include: {
                result: true,
                player1: { select: { id: true, name: true } },
                player2: { select: { id: true, name: true } },
                player3: { select: { id: true, name: true } },
                player4: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    })

    if (!session) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })

    const latestRound = session.rounds[0]
    if (!latestRound) return NextResponse.json({ error: 'No hay ronda activa' }, { status: 400 })

    const incomplete = latestRound.assignments.filter(a => !a.result)
    if (incomplete.length > 0) {
      return NextResponse.json({ error: `Faltan ${incomplete.length} resultados` }, { status: 400 })
    }

    // Construir resultados para el algoritmo
    const courtResults: CourtResult[] = latestRound.assignments.map(a => ({
      courtNumber: a.courtNumber,
      team1: [a.player1, a.player2],
      team2: [a.player3, a.player4],
      winnerTeam: a.result!.winnerTeam as 1 | 2,
    }))

    const nextAssignments = calculateNextRound(courtResults, session.numCourts, session.mode)

    const round = await prisma.$transaction(async (tx) => {
      const round = await tx.round.create({
        data: { sessionId: id, roundNumber: latestRound.roundNumber + 1 },
      })
      await tx.courtAssignment.createMany({
        data: nextAssignments.map(a => ({
          roundId: round.id,
          courtNumber: a.courtNumber,
          player1Id: a.team1[0].id,
          player2Id: a.team1[1].id,
          player3Id: a.team2[0].id,
          player4Id: a.team2[1].id,
        })),
      })
      return round
    })

    return NextResponse.json({ roundId: round.id, roundNumber: round.roundNumber })
  } catch (error) {
    console.error('Next round error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
