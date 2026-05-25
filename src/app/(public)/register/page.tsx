'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const data = {
      name: form.get('name') as string,
      phone: form.get('phone') as string,
      password: form.get('password') as string,
      birthday: form.get('birthday') as string,
      category: form.get('category') as string,
      side: form.get('side') as string,
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Error al registrarse')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="text-4xl mb-2">🎾</div>
        <CardTitle className="font-heading text-2xl">Crear cuenta</CardTitle>
        <CardDescription>Únete a tu grupo de pádel</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" name="name" placeholder="Roberto García" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" type="tel" placeholder="55 1234 5678" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" minLength={6} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="birthday">Fecha de nacimiento</Label>
            <Input id="birthday" name="birthday" type="date" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Categoría</Label>
            <Select name="category" required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecciona tu nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1a">1ª — Elite</SelectItem>
                <SelectItem value="2a">2ª — Avanzado</SelectItem>
                <SelectItem value="3a">3ª — Intermedio</SelectItem>
                <SelectItem value="4a">4ª — Principiante</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>¿De qué lado juegas?</Label>
            <div className="grid grid-cols-2 gap-2">
              {['REVES', 'DRIVE'].map((side) => (
                <label
                  key={side}
                  className="flex items-center justify-center gap-2 border rounded-xl p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/10 transition-colors"
                >
                  <input type="radio" name="side" value={side} className="sr-only" required />
                  <span className="font-semibold text-sm">
                    {side === 'REVES' ? '🏓 Revés' : '🎾 Drive'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>
          )}

          <Button type="submit" className="w-full h-12 text-base font-bold" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Registrarme'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
