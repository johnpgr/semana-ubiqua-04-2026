import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    EMAIL_OPERATIONS_INBOX: z.email().optional(),
  },
  experimental__runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
