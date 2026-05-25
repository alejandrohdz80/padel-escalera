import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { getPenaltyType, PenaltyReasonKey } from '@/lib/escalera/points'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const giver = await prisma.player.findUnique({ where: { authId: user.id } })
    if (!giver) return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })

    const { playerId, reason } = await req.json()

    if (!playerId || !reason) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    }

    // El tipo se deriva siempre del reason — nunca lo elige el usuario
    const type = getPenaltyType(reason as PenaltyReasonKey)

    const penalty = await prisma.penalty.create({
      data: {
        sessionId,
        playerId,
        givenById: giver.id,
        type,
        reason,
      },
      include: { player: { select: { name: true } } },
    })

    return NextResponse.json({ success: true, penalty })
  } catch (error) {
    console.error('Penalty error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params
  const penalties = await prisma.penalty.findMany({
    where: { sessionId },
    include: { player: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(penalties)
}
