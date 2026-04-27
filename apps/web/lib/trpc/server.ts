import { createCallerFactory, appRouter } from '@base-app/api'
import { auth } from '@base-app/auth'
import { headers } from 'next/headers'
import { cache } from 'react'

const createContext = cache(async () => {
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })
  return { session }
})

const createCaller = createCallerFactory(appRouter)

export const api = createCaller(createContext)
