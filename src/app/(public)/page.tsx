import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="w-full max-w-sm text-center space-y-8">
      {/* Logo / Título */}
      <div className="space-y-2">
        <div className="text-6xl">🎾</div>
        <h1 className="text-4xl font-heading text-foreground">
          Padel Escalera
        </h1>
        <p className="text-muted-foreground text-lg">
          Organiza tus torneos, sube resultados y descubre quién debe las caguamas 🍺
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          className="w-full text-base font-bold h-14"
          render={<Link href="/register" />}
        >
          Registrarme
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full text-base h-14"
          render={<Link href="/login" />}
        >
          Ya tengo cuenta
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        🏅 Rankings en tiempo real · 🏆 Torneos escalera · 🍺 Control de castigos
      </p>
    </div>
  )
}
