import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'

async function getPlayer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.player.findUnique({ where: { authId: user.id } })
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const player = await getPlayer()
  if (!player) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Top navbar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-heading text-lg font-extrabold text-primary">
          🎾 Escalera
        </Link>
        <div className="flex items-center gap-2">
          {player.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="text-xs font-semibold bg-accent text-accent-foreground px-2 py-1 rounded-full"
            >
              Admin
            </Link>
          )}
          <span className="text-sm font-medium truncate max-w-[120px]">{player.name}</span>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Bottom navigation — móvil */}
      <nav className="fixed bottom-0 inset-x-0 bg-background border-t border-border z-40">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16">
          <NavItem href="/dashboard" label="Inicio" emoji="🏠" />
          <NavItem href="/sessions" label="Sesiones" emoji="🎾" />
          <NavItem href="/ranking" label="Ranking" emoji="🏆" />
          <NavItem href="/profile" label="Perfil" emoji="👤" />
        </div>
      </nav>
    </div>
  )
}

function NavItem({ href, label, emoji }: { href: string; label: string; emoji: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors py-2 px-4"
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}
