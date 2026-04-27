import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    // Internal URL the Next.js server uses to reach the API (can be a private network address)
    API_URL: z.string().url().default('http://localhost:3001'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },
  client: {
    // Public URL browsers use to reach the API
    NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3001'),
    NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  },
  runtimeEnv: {
    API_URL: process.env['API_URL'],
    NODE_ENV: process.env['NODE_ENV'],
    NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'],
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
  },
  skipValidation: !!process.env['SKIP_ENV_VALIDATION'],
})
