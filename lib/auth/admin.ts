import "server-only"

import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"

import { requireCurrentUser } from "@/lib/auth/profile"

export function isAdmin(user: User | null): boolean {
  return user?.user_metadata?.role === "admin"
}

export async function requireAdmin(): Promise<User> {
  const user = await requireCurrentUser()
  if (!isAdmin(user)) redirect("/")
  return user
}
