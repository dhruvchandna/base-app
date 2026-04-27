import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@base-app/db'
import * as schema from '@base-app/db/schema'

export const auth = betterAuth({
  baseURL: process.env['BETTER_AUTH_URL'] ?? 'http://localhost:3000',
  secret: process.env['BETTER_AUTH_SECRET'] ?? '',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    ...(process.env['GITHUB_CLIENT_ID'] && {
      github: {
        clientId: process.env['GITHUB_CLIENT_ID'],
        clientSecret: process.env['GITHUB_CLIENT_SECRET'] ?? '',
      },
    }),
    ...(process.env['GOOGLE_CLIENT_ID'] && {
      google: {
        clientId: process.env['GOOGLE_CLIENT_ID'],
        clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
      },
    }),
  },
})

export type Auth = typeof auth
export type Session = typeof auth.$Infer.Session
export type AuthUser = typeof auth.$Infer.Session.user
