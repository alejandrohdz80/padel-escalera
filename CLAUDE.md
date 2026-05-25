@AGENTS.md

# Padel Escalera

Web app para torneos escalera de pádel: registro de jugadores, sesiones en tiempo real, resultados, ranking y tracking de castigos.

## Comandos

- `npm run dev` — Servidor de desarrollo (localhost:3000)
- `npm run build` — Build de producción
- `npm run lint` — ESLint
- `npm test` — Vitest (tests unitarios del algoritmo)
- `npm run db:push` — `prisma db push`
- `npm run db:generate` — `prisma generate`
- `npm run db:migrate` — `prisma migrate dev`

## Tech Stack

Next.js 16 (App Router) + TypeScript strict + Tailwind v4 + shadcn/ui (@base-ui/react) + Supabase (Auth + Realtime) + Prisma 7 + @prisma/adapter-pg + Vercel

## Patrones Críticos

- Prisma 7: importar desde `@/generated/prisma`, NO desde `@prisma/client`
- PrismaClient requiere adapter: ver `src/lib/db/prisma.ts`
- Button: usa `render` prop no `asChild` — `<Button render={<Link href="..." />}>`
- Admin check: leer `player.role` desde DB, nunca solo JWT
- Realtime: Supabase channels en `LiveCourts.tsx`, nunca `setInterval`

## Sistema de Puntos

```
percentile = (numCourts - courtNumber) / (numCourts - 1)
Victoria: round(50 + 50 × percentile)  → [50–100 pts]
Derrota:  round(10 + 10 × percentile)  → [10–20 pts]
```
Lógica en `src/lib/escalera/points.ts` únicamente. Tests en `__tests__/points.test.ts`.

## Variables de Entorno (.env.local)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL` (Supabase connection pooling)
