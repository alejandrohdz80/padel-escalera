import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const player = await prisma.player.findUnique({ where: { authId: user.id } })
  if (!player || player.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 h-14 flex items-center gap-3">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">← App</Link>
        <span className="font-heading font-bold text-accent-foreground">⚙️ Admin</span>
      </header>
      <nav className="bg-muted/50 border-b px-4 flex gap-4 text-sm font-medium">
        <Link href="/admin" className="py-2.5 hover:text-primary transition-colors">Panel</Link>
        <Link href="/admin/sessions/new" className="py-2.5 hover:text-primary transition-colors">Nueva sesión</Link>
        <Link href="/admin/players" className="py-2.5 hover:text-primary transition-colors">Jugadores</Link>
      </nav>
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
