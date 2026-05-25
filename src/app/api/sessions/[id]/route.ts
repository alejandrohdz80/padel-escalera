import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      players: { include: { player: { select: { id: true, name: true, category: true, side: true } } } },
      rounds: {
        orderBy: { roundNumber: 'asc' },
        include: {
          assignments: {
            include: {
              result: true,
              player1: { select: { id: true, name: true, category: true } },
              player2: { select: { id: true, name: true, category: true } },
              player3: { select: { id: true, name: true, category: true } },
              player4: { select: { id: true, name: true, category: true } },
            },
            orderBy: { courtNumber: 'asc' },
          },
        },
      },
    },
  })

  if (!session) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(session)
}
