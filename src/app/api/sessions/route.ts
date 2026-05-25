import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const admin = await prisma.player.findUnique({ where: { authId: user.id } })
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo admins pueden crear sesiones' }, { status: 403 })
    }

    const { name, mode, numCourts, playerIds } = await request.json()

    if (!name || !mode || !numCourts || !playerIds) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    if (playerIds.length !== numCourts * 4) {
      return NextResponse.json({
        error: `Se necesitan exactamente ${numCourts * 4} jugadores para ${numCourts} canchas`
      }, { status: 400 })
    }

    const session = await prisma.session.create({
      data: {
        name,
        mode,
        numCourts,
        createdById: admin.id,
        players: {
          create: playerIds.map((playerId: string) => ({ playerId })),
        },
      },
    })

    return NextResponse.json({ id: session.id })
  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
