import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LiveCourts from '@/components/app/LiveCourts'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

async function getData(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const player = await prisma.player.findUnique({ where: { authId: user.id } })
  if (!player) redirect('/login')

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      rounds: {
        orderBy: { roundNumber: 'desc' },
        take: 1,
        include: {
          assignments: {
            include: {
              player1: { select: { id: true, name: true, category: true } },
              player2: { select: { id: true, name: true, category: true } },
              player3: { select: { id: true, name: true, category: true } },
              player4: { select: { id: true, name: true, category: true } },
              result: true,
            },
            orderBy: { courtNumber: 'asc' },
          },
        },
      },
    },
  })

  if (!session) notFound()

  return { session, currentPlayer: player }
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { session, currentPlayer } = await getData(id)

  const latestRound = session.rounds[0]
  const totalCourts = latestRound?.assignments.length ?? 0
  const completedCourts = latestRound?.assignments.filter(a => a.result).length ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl">{session.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={session.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {session.status === 'ACTIVE' ? '🟢 En curso' : session.status === 'FINISHED' ? '✅ Finalizada' : '⏳ Por iniciar'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {session.mode === 'RANDOM_PAIRS' ? '🎲 Parejas aleatorias' : '🤝 Parejas fijas'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/sessions/${id}/penalties`}
            className="text-sm font-semibold bg-[#F59E0B]/10 text-[#B45309] px-3 py-1.5 rounded-xl hover:bg-[#F59E0B]/20 transition-colors"
          >
            🍺 Castigos
          </Link>
        </div>
      </div>

      {latestRound ? (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-muted-foreground">
              Ronda {latestRound.roundNumber}
            </span>
            <span className={`font-semibold ${completedCourts === totalCourts ? 'text-green-600' : 'text-muted-foreground'}`}>
              {completedCourts}/{totalCourts} canchas listas
            </span>
          </div>

          <LiveCourts
            sessionId={id}
            initialAssignments={latestRound.assignments}
            currentPlayerId={currentPlayer.id}
          />
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">⏳</p>
          <p className="font-semibold">Esperando que el admin inicie la sesión</p>
        </div>
      )}

      {session.status === 'FINISHED' && (
        <Link
          href={`/sessions/${id}/summary`}
          className="block w-full text-center bg-accent text-accent-foreground font-bold py-3 rounded-2xl hover:bg-accent/80 transition-colors"
        >
          🏆 Ver resumen final
        </Link>
      )}
    </div>
  )
}
