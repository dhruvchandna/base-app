import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc.js'

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .query(({ input }) => {
      return { greeting: `Hello, ${input.name}!` }
    }),

  getSession: protectedProcedure.query(({ ctx }) => {
    return { user: ctx.session.user }
  }),
})
