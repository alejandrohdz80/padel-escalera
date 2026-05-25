'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function ResultForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courtId = searchParams.get('court')

  const [team1, setTeam1] = useState<number | ''>('')
  const [team2, setTeam2] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string>('')

  useEffect(() => {
    const parts = window.location.pathname.split('/')
    const idx = parts.indexOf('sessions')
    if (idx !== -1) setSessionId(parts[idx + 1])
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (team1 === '' || team2 === '' || !courtId) return
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/sessions/${sessionId}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courtAssignmentId: courtId,
        team1Games: Number(team1),
        team2Games: Number(team2),
      }),
    })

    const json = await res.json()
    if (!res.ok) { setError(json.error); setLoading(false); return }

    if (json.suggestCubeta) {
      alert('⚠️ ¡Resultado 0-6! Recuerda registrar la cubeta en la sección de castigos 🪣')
    }

    router.push(`/sessions/${sessionId}`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl">Subir resultado</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg text-center">¿Cómo quedó?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'Tu equipo', value: team1, setter: setTeam1 },
                { label: 'Rival', value: team2, setter: setTeam2 },
              ].map(({ label, value, setter }) => (
                <div key={label} className="text-center space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">{label}</p>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={value}
                    onChange={e => setter(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-center score-display text-6xl font-extrabold text-primary bg-transparent border-b-4 border-primary outline-none py-2"
                    placeholder="0"
                    required
                  />
                </div>
              ))}
            </div>

            {team1 !== '' && team2 !== '' && team1 !== team2 && (
              <div className={`text-center py-2 rounded-xl font-bold ${
                Number(team1) > Number(team2)
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {Number(team1) > Number(team2) ? '🏆 ¡Ganaron!' : '😔 Perdieron'}
              </div>
            )}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}

        <Button
          type="submit"
          className="w-full h-14 font-bold text-lg"
          disabled={loading || team1 === '' || team2 === '' || team1 === team2}
        >
          {loading ? 'Guardando...' : 'Confirmar resultado'}
        </Button>

        <button
          type="button"
          onClick={() => router.back()}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
      </form>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Cargando...</div>}>
      <ResultForm />
    </Suspense>
  )
}
