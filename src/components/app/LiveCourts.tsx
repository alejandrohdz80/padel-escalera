'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CourtCard from './CourtCard'

interface Player { id: string; name: string; category: string }
interface Result { team1Games: number; team2Games: number; winnerTeam: number }
interface Assignment {
  id: string
  courtNumber: number
  player1: Player; player2: Player
  player3: Player; player4: Player
  result: Result | null
}

interface Props {
  sessionId: string
  initialAssignments: Assignment[]
  currentPlayerId: string
}

export default function LiveCourts({ sessionId, initialAssignments, currentPlayerId }: Props) {
  const router = useRouter()
  const [assignments, setAssignments] = useState(initialAssignments)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'results',
      }, () => {
        // Refrescar datos del servidor cuando se sube un resultado
        router.refresh()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId, router])

  useEffect(() => {
    setAssignments(initialAssignments)
  }, [initialAssignments])

  return (
    <div className="space-y-3">
      {assignments.map(a => (
        <CourtCard
          key={a.id}
          assignment={a}
          sessionId={sessionId}
          currentPlayerId={currentPlayerId}
        />
      ))}
    </div>
  )
}
