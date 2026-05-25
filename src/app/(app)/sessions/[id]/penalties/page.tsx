'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'

interface Player { id: string; name: string }

const PENALTIES = [
  { reason: 'ULTIMO_EN_LLEGAR',    label: 'Último en llegar',     emoji: '🐢', type: 'CAGUAMA' },
  { reason: 'DOBLE_FALTA',         label: 'Doble falta',          emoji: '🎾', type: 'CAGUAMA' },
  { reason: 'CERO_SEIS',           label: '0-6',                  emoji: '🪣', type: 'CUBETA'  },
  { reason: 'REMONTAR_5_0_PERDER', label: 'Iba 5-0 y perdió',    emoji: '😬', type: 'BOTELLA' },
  { reason: 'ABANICADA_REMATE',    label: 'Abanicada en remate',  emoji: '💨', type: 'BOTELLA' },
  { reason: 'BOLITA_DON_ROBER',    label: 'Bolita Don Rober',     emoji: '⚡', type: 'CAGUAMA' },
] as const

const TYPE_COLORS = {
  CAGUAMA: 'bg-[#F59E0B]/10 text-[#B45309] border-[#F59E0B]/30',
  CUBETA:  'bg-[#3B82F6]/10 text-[#1D4ED8] border-[#3B82F6]/30',
  BOTELLA: 'bg-[#8B5CF6]/10 text-[#6D28D9] border-[#8B5CF6]/30',
}

export default function PenaltiesPage() {
  const params = useParams()
  const sessionId = params.id as string

  const [players, setPlayers] = useState<Player[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<typeof PENALTIES[number] | null>(null)
  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState<{ name: string; emoji: string; label: string }[]>([])

  useEffect(() => {
    fetch('/api/players').then(r => r.json()).then(setPlayers)
  }, [])

  async function confirmPenalty() {
    if (!selected || !confirming) return
    setLoading(true)

    const res = await fetch(`/api/sessions/${sessionId}/penalties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: selected, reason: confirming.reason }),
    })

    if (res.ok) {
      const player = players.find(p => p.id === selected)
      setLog(prev => [{ name: player?.name ?? '', emoji: confirming.emoji, label: confirming.label }, ...prev.slice(0, 9)])
    }

    setConfirming(null)
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-3xl">🍺 Castigos</h1>

      {/* Selector de jugador */}
      <div className="space-y-2">
        <p className="font-semibold text-sm">1. ¿Quién?</p>
        <div className="flex flex-wrap gap-2">
          {players.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id === selected ? null : p.id)}
              className={`px-3 py-2 rounded-xl border font-medium text-sm transition-all ${
                selected === p.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Botones de castigos */}
      <div className="space-y-2">
        <p className="font-semibold text-sm">2. ¿Qué hizo?</p>
        <div className="grid grid-cols-2 gap-2">
          {PENALTIES.map(pen => (
            <button
              key={pen.reason}
              disabled={!selected}
              onClick={() => setConfirming(pen)}
              className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${TYPE_COLORS[pen.type]} hover:opacity-80 active:scale-95`}
            >
              <span className="text-2xl shrink-0">{pen.emoji}</span>
              <div>
                <p className="font-semibold text-sm leading-tight">{pen.label}</p>
                <p className="text-xs opacity-70">{pen.type}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Confirmación */}
      {confirming && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50 p-4">
          <Card className="w-full">
            <CardContent className="pt-4 pb-4 space-y-4">
              <p className="text-center font-heading text-lg">
                {confirming.emoji} {players.find(p => p.id === selected)?.name} debe una <strong>{confirming.type}</strong>
              </p>
              <p className="text-center text-sm text-muted-foreground">Razón: {confirming.label}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirming(null)}
                  className="py-3 rounded-xl border font-semibold hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmPenalty}
                  disabled={loading}
                  className="py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90"
                >
                  {loading ? '...' : 'Confirmar'}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Log de castigos recientes */}
      {log.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold text-sm text-muted-foreground">Registrados esta sesión</p>
          {log.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span>{entry.emoji}</span>
              <span className="font-medium">{entry.name}</span>
              <span className="text-muted-foreground">— {entry.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
