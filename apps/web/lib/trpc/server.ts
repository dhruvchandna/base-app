import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '@base-app/api'
import superjson from 'superjson'
import { headers } from 'next/headers'
import { env } from '@/lib/env'

export const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${env.API_URL}/api/trpc`,
      transformer: superjson,
      headers: async () => {
        const hdrs = await headers()
        // Forward cookies so the API server can resolve the session
        return { cookie: hdrs.get('cookie') ?? '' }
      },
    }),
  ],
})
