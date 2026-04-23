import type { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/profile"

import { signOut } from "./actions"

type AppLayoutProps = {
  children: ReactNode
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-svh bg-[linear-gradient(180deg,color-mix(in_oklab,var(--muted)_35%,var(--background)),var(--background)_28%)]">
      <header className="border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <Link
              href="/"
              className="text-sm font-semibold tracking-[0.18em] uppercase"
            >
              OpenCred
            </Link>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline" className="w-full sm:w-auto">
              Sair
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  )
}
