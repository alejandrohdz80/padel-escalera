import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type {} from '@/generated/prisma'

export async function POST(request: NextRequest) {
  try {
    const { name, phone, password, birthday, category, side } = await request.json()

    if (!name || !phone || !password || !birthday || !category || !side) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    // Usamos phone@padel.app como email ficticio para Supabase Auth
    const email = `${phone.replace(/\s/g, '')}@padel.app`

    const supabase = await createClient()

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError || !authData.user) {
      if (authError?.message.includes('already registered')) {
        return NextResponse.json({ error: 'Este teléfono ya está registrado' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 400 })
    }

    // Crear perfil en nuestra DB
    const player = await prisma.player.create({
      data: {
        authId: authData.user.id,
        name: name.trim(),
        phone: phone.replace(/\s/g, ''),
        birthday: new Date(birthday),
        category,
        side,
      },
    })

    // Crear registro de stats vacío
    await prisma.playerStats.create({
      data: { playerId: player.id },
    })

    return NextResponse.json({ success: true, playerId: player.id })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
