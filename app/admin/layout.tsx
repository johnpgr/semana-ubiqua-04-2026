import { requireAdmin } from "@/lib/auth/admin"
import { signOut } from "@/app/(app)/actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdmin()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" render={<Link href="/">← Voltar</Link>} />
            <span className="text-sm font-medium">Painel Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.email}
            </span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
        {children}
      </main>
    </div>
  )
}
