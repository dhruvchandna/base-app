import { createTRPCRouter } from '../trpc.js'
import { exampleRouter } from './example.js'

export const appRouter = createTRPCRouter({
  example: exampleRouter,
})

export type AppRouter = typeof appRouter
