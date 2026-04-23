import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "./database.types"

export function createClient() {
  return createBrowserClient<Database>(
    getRequiredEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    getRequiredEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  )
}

function getRequiredEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}
