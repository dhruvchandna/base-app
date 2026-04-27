'use client'

import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@base-app/api'

export const trpc = createTRPCReact<AppRouter>()
