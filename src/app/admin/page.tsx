import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent } from '@/components/ui/card'

export default async function AdminPage() {
  const [playerCount, activeSession, pendingSession] = await Promise.all([
    prisma.player.count(),
    prisma.session.findFirst({ where: { status: 'ACTIVE' } }),
    prisma.session.findFirst({ where: { status: 'PENDING' } }),
  ])

  const currentSession = activeSession ?? pendingSession

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-3xl">⚙️ Admin</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="font-heading text-3xl font-bold text-primary">{playerCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Jugadores registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="font-heading text-3xl font-bold text-secondary">
              {activeSession ? '🟢' : '⭕'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeSession ? 'Sesión activa' : 'Sin sesión activa'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3">
        {currentSession ? (
          <Link href={`/admin/sessions/${currentSession.id}/manage`}>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-primary/30">
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{currentSession.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{currentSession.status.toLowerCase()}</p>
                </div>
                <span className="text-2xl">→</span>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Link href="/admin/sessions/new">
            <Card className="cursor-pointer hover:bg-primary/5 transition-colors border-dashed border-primary/50">
              <CardContent className="pt-4 pb-4 flex items-center justify-center gap-2 text-primary">
                <span className="text-xl">＋</span>
                <span className="font-semibold">Crear nueva sesión</span>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href="/admin/players">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="pt-4 pb-4 flex items-center justify-between">
              <span className="font-semibold">👥 Gestionar jugadores</span>
              <span className="text-muted-foreground">→</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
