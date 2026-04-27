import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@base-app/api'
import { auth } from '@base-app/auth'
import type { NextRequest } from 'next/server'

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      const session = await auth.api.getSession({ headers: req.headers })
      return { session }
    },
    onError:
      process.env['NODE_ENV'] === 'development'
        ? ({ path, error }) => {
            console.error(`tRPC error on ${path ?? '<no-path>'}:`, error)
          }
        : undefined,
  })

export { handler as GET, handler as POST }
