import Link from "next/link"

import { signOut } from "@/app/(app)/actions"
import { Button } from "@/components/ui/button"
import { requireAdmin } from "@/lib/auth/admin"

const backLink = <Link href="/" />

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdmin()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="sm" render={backLink}>
              Voltar
            </Button>
            <span className="text-sm font-medium">Painel Admin</span>
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="truncate text-sm text-muted-foreground">
              {user.email}
            </span>
            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6">
        {children}
      </main>
    </div>
  )
}
