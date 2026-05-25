import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { createInitialAssignment } from '@/lib/escalera/assignment'

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
        players: { include: { player: true } },
      },
    })

    if (!session) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    if (session.status !== 'PENDING') return NextResponse.json({ error: 'La sesión ya fue iniciada' }, { status: 400 })

    const players = session.players.map(sp => ({
      id: sp.player.id,
      name: sp.player.name,
      category: sp.player.category,
    }))

    const assignments = createInitialAssignment(players, session.numCourts, session.mode)

    // Crear ronda 1 y asignaciones de canchas en una transacción
    const round = await prisma.$transaction(async (tx) => {
      await tx.session.update({ where: { id }, data: { status: 'ACTIVE' } })

      const round = await tx.round.create({
        data: { sessionId: id, roundNumber: 1 },
      })

      await tx.courtAssignment.createMany({
        data: assignments.map(a => ({
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

    return NextResponse.json({ roundId: round.id, assignments })
  } catch (error) {
    console.error('Start session error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
