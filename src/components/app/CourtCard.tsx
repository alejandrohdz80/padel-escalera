import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Player { id: string; name: string; category: string }
interface Assignment {
  id: string; courtNumber: number
  player1: Player; player2: Player
  player3: Player; player4: Player
  result: { team1Games: number; team2Games: number; winnerTeam: number } | null
}

interface Props {
  assignment: Assignment
  sessionId: string
  currentPlayerId: string
}

export default function CourtCard({ assignment: a, sessionId, currentPlayerId }: Props) {
  const myTeam = [a.player1.id, a.player2.id].includes(currentPlayerId) ? 1
    : [a.player3.id, a.player4.id].includes(currentPlayerId) ? 2
    : null

  const isMyGame = myTeam !== null
  const hasResult = !!a.result

  const courtLabel = a.courtNumber === 1 ? '👑 Cancha 1' : `Cancha ${a.courtNumber}`
  const cardBg = a.courtNumber === 1 ? 'border-[#FFD60A]/50 bg-[#FFD60A]/5' : ''

  return (
    <Card className={`overflow-hidden ${cardBg}`}>
      <CardContent className="pt-3 pb-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="font-heading font-bold text-base">{courtLabel}</span>
          {hasResult ? (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Listo</span>
          ) : isMyGame ? (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Tu cancha</span>
          ) : null}
        </div>

        {/* Marcador si ya hay resultado */}
        {hasResult ? (
          <div className="flex items-center justify-center gap-4 py-1">
            <TeamResult
              players={[a.player1, a.player2]}
              games={a.result!.team1Games}
              won={a.result!.winnerTeam === 1}
            />
            <span className="font-heading text-2xl text-muted-foreground">VS</span>
            <TeamResult
              players={[a.player3, a.player4]}
              games={a.result!.team2Games}
              won={a.result!.winnerTeam === 2}
            />
          </div>
        ) : (
          /* Sin resultado: mostrar equipos */
          <div className="flex items-center gap-2">
            <TeamPlayers players={[a.player1, a.player2]} />
            <span className="font-heading font-bold text-muted-foreground text-sm shrink-0">VS</span>
            <TeamPlayers players={[a.player3, a.player4]} right />
          </div>
        )}

        {/* Botón subir resultado */}
        {!hasResult && isMyGame && (
          <Link
            href={`/sessions/${sessionId}/results?court=${a.id}`}
            className="block w-full text-center bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors"
          >
            Subir resultado
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

function TeamPlayers({ players, right }: { players: Player[]; right?: boolean }) {
  return (
    <div className={`flex-1 space-y-1 ${right ? 'text-right' : ''}`}>
      {players.map(p => (
        <div key={p.id} className={`flex items-center gap-1 ${right ? 'justify-end' : ''}`}>
          <span className="text-sm font-medium truncate">{p.name.split(' ')[0]}</span>
          <Badge variant="secondary" className="text-[10px] shrink-0">{p.category}</Badge>
        </div>
      ))}
    </div>
  )
}

function TeamResult({ players, games, won }: { players: Player[]; games: number; won: boolean }) {
  return (
    <div className={`text-center flex-1 ${won ? '' : 'opacity-60'}`}>
      <p className={`score-display text-4xl font-extrabold ${won ? 'text-primary' : 'text-muted-foreground'}`}>
        {games}
      </p>
      <div className="space-y-0.5 mt-1">
        {players.map(p => (
          <p key={p.id} className="text-xs text-muted-foreground truncate">{p.name.split(' ')[0]}</p>
        ))}
      </div>
      {won && <span className="text-xs font-bold text-primary">🏆 Ganó</span>}
    </div>
  )
}
