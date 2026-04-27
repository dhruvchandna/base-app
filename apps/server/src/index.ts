import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { trpcServer } from '@hono/trpc-server'
import { appRouter } from '@base-app/api'
import { auth } from '@base-app/auth'
import { createContext } from './context.js'

const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',').map((o) => o.trim()) ?? [
  'http://localhost:3000',
]

const app = new Hono()

app.use(logger())

app.use(
  '*',
  cors({
    origin: allowedOrigins,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-trpc-source'],
    credentials: true,
  }),
)

app.use(
  '/api/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: (_opts, c) => createContext(c),
    onError:
      process.env['NODE_ENV'] === 'development'
        ? ({ path, error }) => {
            console.error(`tRPC error on ${path ?? '<no-path>'}:`, error)
          }
        : undefined,
  }),
)

app.on(['GET', 'POST'], '/api/auth/**', (c) => auth.handler(c.req.raw))

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

const port = Number(process.env['PORT'] ?? 3001)

serve({ fetch: app.fetch, port }, () => {
  console.warn(`API server running on http://localhost:${port}`)
})

export default app
