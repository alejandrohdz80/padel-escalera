import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

async function getSessionSummary(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      rounds: {
        include: {
          assignments: {
            include: {
              result: true,
              player1: { select: { id: true, name: true } },
              player2: { select: { id: true, name: true } },
              player3: { select: { id: true, name: true } },
              player4: { select: { id: true, name: true } },
            },
          },
        },
      },
      penalties: {
        include: { player: { select: { id: true, name: true } } },
      },
    },
  })

  if (!session) notFound()

  // Calcular stats por jugador
  const stats: Record<string, { name: string; wins: number; losses: number; court1Rounds: number }> = {}

  for (const round of session.rounds) {
    for (const a of round.assignments) {
      if (!a.result) continue

      const allPlayers = [a.player1, a.player2, a.player3, a.player4]
      const winners = a.result.winnerTeam === 1 ? [a.player1, a.player2] : [a.player3, a.player4]
      const losers  = a.result.winnerTeam === 1 ? [a.player3, a.player4] : [a.player1, a.player2]

      for (const p of allPlayers) {
        if (!stats[p.id]) stats[p.id] = { name: p.name, wins: 0, losses: 0, court1Rounds: 0 }
        if (a.courtNumber === 1) stats[p.id].court1Rounds++
      }
      for (const p of winners) stats[p.id].wins++
      for (const p of losers)  stats[p.id].losses++
    }
  }

  const sorted = Object.values(stats).sort((a, b) => b.wins - a.wins)
  const topWinner = sorted[0]
  const topLoser  = [...sorted].sort((a, b) => b.losses - a.losses)[0]
  const mostCourt1 = [...sorted].sort((a, b) => b.court1Rounds - a.court1Rounds)[0]

  // Agrupar castigos por jugador
  const penaltyMap: Record<string, { name: string; caguamas: number; botellas: number; cubetas: number }> = {}
  for (const pen of session.penalties) {
    if (!penaltyMap[pen.playerId]) {
      penaltyMap[pen.playerId] = { name: pen.player.name, caguamas: 0, botellas: 0, cubetas: 0 }
    }
    if (pen.type === 'CAGUAMA') penaltyMap[pen.playerId].caguamas++
    else if (pen.type === 'BOTELLA') penaltyMap[pen.playerId].botellas++
    else if (pen.type === 'CUBETA') penaltyMap[pen.playerId].cubetas++
  }

  const penaltySummary = Object.values(penaltyMap)
    .filter(p => p.caguamas + p.botellas + p.cubetas > 0)
    .sort((a, b) => (b.caguamas + b.botellas * 2 + b.cubetas * 3) - (a.caguamas + a.botellas * 2 + a.cubetas * 3))

  return { session, topWinner, topLoser, mostCourt1, penaltySummary, totalRounds: session.rounds.length }
}

function penaltyText(p: { caguamas: number; botellas: number; cubetas: number }) {
  const parts = []
  if (p.caguamas > 0) parts.push(`${p.caguamas} 🍺${p.caguamas > 1 ? ' caguamas' : ' caguama'}`)
  if (p.botellas > 0) parts.push(`${p.botellas} 🍾${p.botellas > 1 ? ' botellas' : ' botella'}`)
  if (p.cubetas  > 0) parts.push(`${p.cubetas} 🪣${p.cubetas  > 1 ? ' cubetas'  : ' cubeta'}`)
  return parts.join(' + ')
}

export default async function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { session, topWinner, topLoser, mostCourt1, penaltySummary, totalRounds } = await getSessionSummary(id)

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="font-heading text-3xl">🏆 Resumen</h1>
        <p className="text-muted-foreground text-sm mt-1">{session.name} · {totalRounds} rondas</p>
      </div>

      {/* MVP del día */}
      {topWinner && (
        <Card className="border-[#FFD60A]/50 bg-gradient-to-br from-[#FFD60A]/10 to-[#FF6B35]/5">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-4xl mb-1">👑</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Rey del día</p>
            <p className="font-heading text-2xl font-extrabold">{topWinner.name}</p>
            <p className="text-primary font-bold mt-1">{topWinner.wins} victorias</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        {topLoser && (
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-3xl mb-1">😅</p>
              <p className="text-xs text-muted-foreground">Más derrotas</p>
              <p className="font-heading font-bold truncate">{topLoser.name.split(' ')[0]}</p>
              <p className="text-sm text-muted-foreground">{topLoser.losses} derrotas</p>
            </CardContent>
          </Card>
        )}
        {mostCourt1 && mostCourt1.court1Rounds > 0 && (
          <Card className="border-[#FFD60A]/30">
            <CardContent className="pt-3 pb-3 text-center">
              <p className="text-3xl mb-1">🏅</p>
              <p className="text-xs text-muted-foreground">Más tiempo en C1</p>
              <p className="font-heading font-bold truncate">{mostCourt1.name.split(' ')[0]}</p>
              <p className="text-sm text-muted-foreground">{mostCourt1.court1Rounds} rondas</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabla de deudas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg">🍺 ¿Quién debe qué?</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {penaltySummary.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-3">¡Nadie debe nada! 🎉</p>
          ) : (
            <div className="divide-y divide-border">
              {penaltySummary.map(p => (
                <div key={p.name} className="py-3">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{penaltyText(p)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
