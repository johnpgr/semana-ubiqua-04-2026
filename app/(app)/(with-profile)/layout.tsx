import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { getCurrentProfile } from "@/lib/auth/profile"

type WithProfileLayoutProps = {
  children: ReactNode
}

export default async function WithProfileLayout({
  children,
}: WithProfileLayoutProps) {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect("/cadastro")
  }

  return children
}
