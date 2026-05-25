import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function SessionsPage() {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { players: true, rounds: true } } },
  })

  const statusLabel = { PENDING: '⏳ Por iniciar', ACTIVE: '🟢 En curso', FINISHED: '✅ Finalizada' }
  const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    ACTIVE: 'default', PENDING: 'secondary', FINISHED: 'outline',
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-3xl">🎾 Sesiones</h1>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">📋</p>
          <p>Aún no hay sesiones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <Link key={s.id} href={s.status === 'FINISHED' ? `/sessions/${s.id}/summary` : `/sessions/${s.id}`}>
              <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                <CardContent className="pt-4 pb-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s._count.players} jugadores · {s._count.rounds} rondas
                    </p>
                  </div>
                  <Badge variant={statusVariant[s.status]}>
                    {statusLabel[s.status]}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
