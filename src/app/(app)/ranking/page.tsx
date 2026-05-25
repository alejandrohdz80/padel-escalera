import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { differenceInDays } from 'date-fns'

export default async function RankingPage() {
  const stats = await prisma.playerStats.findMany({
    orderBy: { totalPoints: 'desc' },
    include: { player: true },
  })

  const allPlayers = await prisma.player.findMany({
    where: { stats: null },
    orderBy: { name: 'asc' },
  })

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-3xl">🏆 Ranking</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-base text-muted-foreground">Jugadores con puntos</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {stats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aún no hay partidos jugados</p>
          ) : (
            <div className="divide-y divide-border">
              {stats.map((s, i) => {
                const isActive = s.lastPlayedAt
                  ? differenceInDays(new Date(), new Date(s.lastPlayedAt)) <= 7
                  : false
                const ratio = s.wins + s.losses > 0
                  ? ((s.wins / (s.wins + s.losses)) * 100).toFixed(0)
                  : '0'

                return (
                  <div key={s.id} className="py-3 flex items-center gap-3">
                    <span className="w-8 text-center font-heading font-bold text-lg shrink-0">
                      {medals[i] ?? `${i + 1}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{s.player.name}</span>
                        <Badge variant="secondary" className="text-xs shrink-0">{s.player.category}</Badge>
                        {isActive && (
                          <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full shrink-0">
                            Esta semana
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>{s.wins}V / {s.losses}D</span>
                        <span>{ratio}% efectividad</span>
                        <span>{s.sessionsPlayed} sesiones</span>
                      </div>
                    </div>
                    <span className="font-heading font-bold text-primary text-lg shrink-0">
                      {Math.round(s.totalPoints)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {allPlayers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base text-muted-foreground">Sin partidos aún</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {allPlayers.map(p => (
              <div key={p.id} className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">{p.name}</span>
                <Badge variant="outline" className="text-xs">{p.category}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
