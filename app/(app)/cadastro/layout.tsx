import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { getCurrentProfile } from "@/lib/auth/profile"

type CadastroLayoutProps = {
  children: ReactNode
}

export default async function CadastroLayout({
  children,
}: CadastroLayoutProps) {
  const profile = await getCurrentProfile()

  if (profile) {
    redirect("/solicitacao")
  }

  return children
}
