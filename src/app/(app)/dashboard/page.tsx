import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

async function getData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const player = await prisma.player.findUnique({ where: { authId: user.id } })
  if (!player) redirect('/login')

  const [activeSession, topPlayers, recentSessions] = await Promise.all([
    prisma.session.findFirst({
      where: { status: 'ACTIVE' },
      include: { players: { include: { player: true } } },
    }),
    prisma.playerStats.findMany({
      orderBy: { totalPoints: 'desc' },
      take: 5,
      include: { player: true },
    }),
    prisma.session.findMany({
      where: { status: 'FINISHED' },
      orderBy: { endedAt: 'desc' },
      take: 3,
    }),
  ])

  return { player, activeSession, topPlayers, recentSessions }
}

export default async function DashboardPage() {
  const { player, activeSession, topPlayers, recentSessions } = await getData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Hola, {player.name.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {player.category} · {player.side === 'REVES' ? 'Revés' : 'Drive'}
        </p>
      </div>

      {/* Sesión activa */}
      {activeSession ? (
        <Link href={`/sessions/${activeSession.id}`}>
          <Card className="border-primary/50 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">En curso</span>
                  </div>
                  <p className="font-heading text-xl">{activeSession.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {activeSession.numCourts} canchas · {activeSession.players.length} jugadores
                  </p>
                </div>
                <span className="text-3xl">🎾</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-4 pb-4 text-center text-muted-foreground">
            <p className="text-2xl mb-1">😴</p>
            <p className="text-sm">No hay sesión activa</p>
          </CardContent>
        </Card>
      )}

      {/* Top 5 ranking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-lg flex items-center justify-between">
            <span>🏆 Ranking</span>
            <Link href="/ranking" className="text-sm font-normal text-primary hover:underline">
              Ver todo
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {topPlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">Aún no hay partidos jugados</p>
          ) : (
            <div className="space-y-2">
              {topPlayers.map((stats, i) => (
                <div key={stats.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-center font-heading font-bold text-sm">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </span>
                    <span className="font-medium text-sm">{stats.player.name}</span>
                    <Badge variant="secondary" className="text-xs">{stats.player.category}</Badge>
                  </div>
                  <span className="font-heading font-bold text-primary">{Math.round(stats.totalPoints)} pts</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sesiones recientes */}
      {recentSessions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg">📋 Últimas sesiones</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {recentSessions.map(s => (
              <Link key={s.id} href={`/sessions/${s.id}/summary`}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-muted transition-colors">
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-xs text-muted-foreground">
                  {s.endedAt ? new Date(s.endedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : ''}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
