import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { env as clientEnv } from "@/env/client"
import { env as serverEnv } from "@/env/server"

import type { Database } from "./database.types"

export function createServiceClient() {
  return createSupabaseClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  )
}
