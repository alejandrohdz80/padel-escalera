'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Player { id: string; name: string }
interface Session {
  id: string; name: string; status: string; mode: string; numCourts: number
  players: { player: Player; arrivedLate: boolean }[]
  rounds: { roundNumber: number; assignments: { result: unknown }[] }[]
}

export default function ManageSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [latePlayers, setLatePlayers] = useState<Set<string>>(new Set())

  async function loadSession() {
    const res = await fetch(`/api/sessions/${sessionId}`)
    const data = await res.json()
    setSession(data)
  }

  useEffect(() => { loadSession() }, [sessionId])

  const latestRound = session?.rounds?.slice(-1)[0]
  const allDone = latestRound
    ? latestRound.assignments.every(a => a.result !== null)
    : false

  async function handleStart() {
    setLoading(true)
    // Registrar tardanzas primero
    for (const playerId of latePlayers) {
      await fetch(`/api/sessions/${sessionId}/penalties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, reason: 'ULTIMO_EN_LLEGAR' }),
      })
    }
    await fetch(`/api/sessions/${sessionId}/start`, { method: 'POST' })
    await loadSession()
    setLoading(false)
  }

  async function handleNextRound() {
    setLoading(true)
    await fetch(`/api/sessions/${sessionId}/next-round`, { method: 'POST' })
    await loadSession()
    setLoading(false)
  }

  async function handleFinish() {
    if (!confirm('¿Terminar la sesión?')) return
    setLoading(true)
    await fetch(`/api/sessions/${sessionId}/finish`, { method: 'POST' })
    router.push(`/sessions/${sessionId}/summary`)
  }

  if (!session) return <div className="text-center py-12 text-muted-foreground">Cargando...</div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl">{session.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {session.numCourts} canchas · {session.mode === 'RANDOM_PAIRS' ? 'Parejas aleatorias' : 'Parejas fijas'}
        </p>
      </div>

      {/* Estado de la sesión */}
      <div className={`p-3 rounded-2xl text-sm font-semibold text-center ${
        session.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
        session.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
        'bg-muted text-muted-foreground'
      }`}>
        {session.status === 'PENDING' ? '⏳ Por iniciar'
          : session.status === 'ACTIVE' ? `🟢 Ronda ${latestRound?.roundNumber ?? 1} en curso`
          : '✅ Finalizada'}
      </div>

      {/* Marcar tardanzas (solo antes de iniciar) */}
      {session.status === 'PENDING' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base">🐢 ¿Quién llegó tarde?</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {session.players.map(({ player }) => (
                <button
                  key={player.id}
                  onClick={() => setLatePlayers(prev => {
                    const next = new Set(prev)
                    next.has(player.id) ? next.delete(player.id) : next.add(player.id)
                    return next
                  })}
                  className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                    latePlayers.has(player.id)
                      ? 'border-destructive bg-destructive/10 text-destructive'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {player.name.split(' ')[0]}
                  {latePlayers.has(player.id) && ' 🐢'}
                </button>
              ))}
            </div>
            {latePlayers.size > 0 && (
              <p className="text-xs text-destructive mt-2">
                Se registrará 1 caguama a cada uno al iniciar
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progreso de la ronda actual */}
      {session.status === 'ACTIVE' && latestRound && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">Ronda {latestRound.roundNumber}</span>
              <span className="text-sm text-muted-foreground">
                {latestRound.assignments.filter(a => a.result).length}/{latestRound.assignments.length} resultados
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(latestRound.assignments.filter(a => a.result).length / latestRound.assignments.length) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      <div className="space-y-2">
        {session.status === 'PENDING' && (
          <Button className="w-full h-12 font-bold" onClick={handleStart} disabled={loading}>
            {loading ? 'Iniciando...' : '🚀 Iniciar sesión'}
          </Button>
        )}

        {session.status === 'ACTIVE' && (
          <>
            <Button
              className="w-full h-12 font-bold"
              onClick={handleNextRound}
              disabled={!allDone || loading}
            >
              {loading ? 'Calculando...' : allDone ? '⏭️ Siguiente ronda' : '⏳ Esperando resultados...'}
            </Button>
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={handleFinish}
              disabled={loading}
            >
              🏁 Terminar sesión
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
