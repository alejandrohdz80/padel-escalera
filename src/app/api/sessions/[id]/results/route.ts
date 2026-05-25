import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { calculateCourtPoints } from '@/lib/escalera/points'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const player = await prisma.player.findUnique({ where: { authId: user.id } })
    if (!player) return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })

    const { courtAssignmentId, team1Games, team2Games } = await req.json()

    if (team1Games === undefined || team2Games === undefined || !courtAssignmentId) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    }

    // Verificar que el jugador está en esa cancha
    const assignment = await prisma.courtAssignment.findUnique({
      where: { id: courtAssignmentId },
      include: { round: { include: { session: true } } },
    })

    if (!assignment) return NextResponse.json({ error: 'Cancha no encontrada' }, { status: 404 })
    if (assignment.round.sessionId !== sessionId) return NextResponse.json({ error: 'Sesión incorrecta' }, { status: 400 })

    const playerIds = [assignment.player1Id, assignment.player2Id, assignment.player3Id, assignment.player4Id]
    if (!playerIds.includes(player.id)) {
      return NextResponse.json({ error: 'No estás en esta cancha' }, { status: 403 })
    }

    const winnerTeam = team1Games > team2Games ? 1 : 2
    const session = assignment.round.session

    // Calcular puntos normalizados por percentil
    const { team1Points, team2Points } = calculateCourtPoints(
      assignment.courtNumber,
      session.numCourts,
      winnerTeam as 1 | 2
    )

    const team1Players = [assignment.player1Id, assignment.player2Id]
    const team2Players = [assignment.player3Id, assignment.player4Id]

    await prisma.$transaction(async (tx) => {
      // Guardar resultado
      await tx.result.create({
        data: {
          courtAssignmentId,
          team1Games,
          team2Games,
          winnerTeam,
          submittedById: player.id,
        },
      })

      // Actualizar puntos de los 4 jugadores
      for (const playerId of team1Players) {
        const won = winnerTeam === 1
        await updatePlayerStats(tx, playerId, sessionId, team1Points, won)
      }
      for (const playerId of team2Players) {
        const won = winnerTeam === 2
        await updatePlayerStats(tx, playerId, sessionId, team2Points, won)
      }
    })

    const suggestCubeta = team1Games === 0 || team2Games === 0

    return NextResponse.json({ success: true, suggestCubeta })
  } catch (error) {
    console.error('Submit result error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

async function updatePlayerStats(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  playerId: string,
  sessionId: string,
  points: number,
  won: boolean
) {
  // Verificar si ya comprometimos puntos para esta sesión
  const sp = await tx.sessionPlayer.findUnique({
    where: { sessionId_playerId: { sessionId, playerId } },
  })

  const firstResult = sp && !sp.pointsCommitted

  await tx.playerStats.upsert({
    where: { playerId },
    create: {
      playerId,
      totalPoints: points,
      wins: won ? 1 : 0,
      losses: won ? 0 : 1,
      sessionsPlayed: 1,
      lastPlayedAt: new Date(),
    },
    update: {
      totalPoints: { increment: points },
      wins: { increment: won ? 1 : 0 },
      losses: { increment: won ? 0 : 1 },
      sessionsPlayed: firstResult ? { increment: 1 } : undefined,
      lastPlayedAt: new Date(),
    },
  })

  // Marcar como comprometido para no contar doble en sessionsPlayed
  if (firstResult) {
    await tx.sessionPlayer.update({
      where: { sessionId_playerId: { sessionId, playerId } },
      data: { pointsCommitted: true },
    })
  }
}
