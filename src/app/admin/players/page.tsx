import { prisma } from '@/lib/db/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminPlayersPage() {
  const players = await prisma.player.findMany({
    orderBy: [{ role: 'asc' }, { category: 'asc' }, { name: 'asc' }],
    include: { stats: true },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">👥 Jugadores</h1>
        <span className="text-sm text-muted-foreground">{players.length} registrados</span>
      </div>

      <div className="space-y-2">
        {players.map(p => (
          <Card key={p.id}>
            <CardContent className="pt-3 pb-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{p.name}</span>
                  {p.role === 'ADMIN' && (
                    <Badge className="text-[10px] bg-accent text-accent-foreground">Admin</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  📱 {p.phone} · {p.side === 'REVES' ? 'Revés' : 'Drive'}
                </p>
              </div>
              <div className="text-right">
                <Badge variant="secondary">{p.category}</Badge>
                {p.stats && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {Math.round(p.stats.totalPoints)} pts
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
