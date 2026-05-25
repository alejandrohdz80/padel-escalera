'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Player {
  id: string
  name: string
  category: string
  side: string
}

export default function NewSessionPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [numCourts, setNumCourts] = useState(2)
  const [mode, setMode] = useState<'FIXED_PAIRS' | 'RANDOM_PAIRS'>('RANDOM_PAIRS')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/players').then(r => r.json()).then(setPlayers)
    const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
    setName(`Sesión del ${today}`)
  }, [])

  const required = numCourts * 4
  const isValid = selected.size === required && name.trim().length > 0

  function togglePlayer(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mode, numCourts, playerIds: Array.from(selected) }),
    })
    const json = await res.json()

    if (!res.ok) { setError(json.error); setLoading(false); return }
    router.push(`/admin/sessions/${json.id}/manage`)
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl">Nueva sesión</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Nombre de la sesión</Label>
          <Input value={name} onChange={e => setName(e.target.value)} required />
        </div>

        {/* Modo */}
        <div className="space-y-2">
          <Label>Modo de juego</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'RANDOM_PAIRS', label: '🎲 Parejas aleatorias', desc: 'Cada set con diferente pareja' },
              { value: 'FIXED_PAIRS', label: '🤝 Parejas fijas', desc: 'Misma pareja todo el tiempo' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMode(opt.value as typeof mode)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  mode === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <p className="font-semibold text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Canchas */}
        <div className="space-y-2">
          <Label>Número de canchas: <span className="font-bold text-primary">{numCourts}</span></Label>
          <input
            type="range" min={2} max={10} value={numCourts}
            onChange={e => setNumCourts(Number(e.target.value))}
            className="w-full accent-[#FF6B35]"
          />
          <p className="text-xs text-muted-foreground">
            Necesitas exactamente <span className="font-bold">{required} jugadores</span> seleccionados
          </p>
        </div>

        {/* Selección de jugadores */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Jugadores ({selected.size}/{required})</Label>
            {selected.size === required && <span className="text-xs text-green-600 font-semibold">✓ Listo</span>}
            {selected.size > required && <span className="text-xs text-destructive font-semibold">Demasiados</span>}
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {players.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePlayer(p.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  selected.has(p.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <span className="font-medium text-sm">{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.category} · {p.side === 'REVES' ? 'Revés' : 'Drive'}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}

        <Button type="submit" className="w-full h-12 font-bold text-base" disabled={!isValid || loading}>
          {loading ? 'Creando...' : 'Crear sesión'}
        </Button>
      </form>
    </div>
  )
}
