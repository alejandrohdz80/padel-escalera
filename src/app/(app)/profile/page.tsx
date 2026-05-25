import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const PENALTY_EMOJI = { CAGUAMA: '🍺', CUBETA: '🪣', BOTELLA: '🍾' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const player = await prisma.player.findUnique({
    where: { authId: user.id },
    include: {
      stats: true,
      penaltiesReceived: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })
  if (!player) redirect('/login')

  const stats = player.stats
  const ratio = stats && (stats.wins + stats.losses) > 0
    ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(0)
    : '0'

  const penaltyCount = {
    CAGUAMA: player.penaltiesReceived.filter(p => p.type === 'CAGUAMA').length,
    CUBETA:  player.penaltiesReceived.filter(p => p.type === 'CUBETA').length,
    BOTELLA: player.penaltiesReceived.filter(p => p.type === 'BOTELLA').length,
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-heading font-bold text-primary">
          {player.name[0].toUpperCase()}
        </div>
        <div>
          <h1 className="font-heading text-2xl font-extrabold">{player.name}</h1>
          <div className="flex gap-2 mt-1">
            <Badge>{player.category}</Badge>
            <Badge variant="outline">{player.side === 'REVES' ? '🏓 Revés' : '🎾 Drive'}</Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Puntos', value: Math.round(stats?.totalPoints ?? 0), color: 'text-primary' },
          { label: 'Victorias', value: stats?.wins ?? 0, color: 'text-green-600' },
          { label: 'Efectividad', value: `${ratio}%`, color: 'text-secondary' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-3 pb-3 text-center">
              <p className={`font-heading text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-3 pb-3">
          <div className="flex justify-around">
            {[
              { label: 'Sesiones', value: stats?.sessionsPlayed ?? 0 },
              { label: 'Derrotas', value: stats?.losses ?? 0 },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="font-heading text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historial de castigos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg">🍺 Historial de castigos</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-4 mb-3">
            {Object.entries(penaltyCount).map(([type, count]) => (
              <div key={type} className="text-center">
                <p className="text-2xl">{PENALTY_EMOJI[type as keyof typeof PENALTY_EMOJI]}</p>
                <p className="font-bold text-sm">{count}</p>
                <p className="text-xs text-muted-foreground">{type.toLowerCase()}</p>
              </div>
            ))}
          </div>

          {player.penaltiesReceived.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">¡Sin castigos! 😇</p>
          ) : (
            <div className="space-y-1">
              {player.penaltiesReceived.slice(0, 10).map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span>{PENALTY_EMOJI[p.type]} {p.type.toLowerCase()}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
