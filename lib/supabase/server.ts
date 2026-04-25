import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { env as clientEnv } from "@/env/client"

import type { Database } from "./database.types"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Components cannot always write cookies. A future proxy can refresh auth sessions.
          }
        },
      },
    }
  )
}
