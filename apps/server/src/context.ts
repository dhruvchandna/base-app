import { auth } from '@base-app/auth'
import type { TRPCContext } from '@base-app/api'
import type { Context } from 'hono'

export async function createContext(c: Context): Promise<TRPCContext> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  return { session }
}
