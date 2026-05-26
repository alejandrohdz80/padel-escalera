import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const { name, phone, password, birthday, category, side } = await request.json()

    if (!name || !phone || !password || !birthday || !category || !side) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    // Usamos phone@padel.app como email ficticio para Supabase Auth
    const email = `${phone.replace(/\s/g, '')}@padel.app`

    // Usamos admin client para crear usuario auto-confirmado (sin verificación por email)
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      const msg = authError?.message ?? 'user_null'
      console.error('Supabase createUser failed:', msg)
      if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('already exists')) {
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
