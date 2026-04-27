import { Button } from '@base-app/ui/components/button'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Base App</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Your monorepo scaffold is ready. Start building.
        </p>
      </div>

      <div className="flex gap-3">
        <Button>Get started</Button>
        <Button variant="outline">View docs</Button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
        {[
          { title: 'Next.js 15', desc: 'App Router + Server Components' },
          { title: 'tRPC + TanStack Query', desc: 'End-to-end type-safe API' },
          { title: 'Drizzle + PostgreSQL', desc: 'Type-safe database layer' },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border p-4">
            <p className="font-semibold">{item.title}</p>
            <p className="mt-1 text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
