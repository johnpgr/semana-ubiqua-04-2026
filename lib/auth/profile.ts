import "server-only"

import { redirect } from "next/navigation"
import { cache } from "react"
import type { User } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user ?? null
})

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
})

export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

export async function requireCurrentProfile(): Promise<Profile> {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect("/cadastro")
  }

  return profile
}
