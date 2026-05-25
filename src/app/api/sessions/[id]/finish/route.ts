import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const admin = await prisma.player.findUnique({ where: { authId: user.id } })
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo admins' }, { status: 403 })
    }

    await prisma.session.update({
      where: { id },
      data: { status: 'FINISHED', endedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Finish session error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
