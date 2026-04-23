# OpenCred

Aplicacao Next.js com shadcn/ui e Supabase.

## Supabase

O projeto ja versiona `supabase/config.toml` e as migrations em `supabase/migrations`.
Use `npx supabase init` somente se estiver em uma copia sem `supabase/config.toml`.

### Variaveis de ambiente

Crie um `.env.local` a partir do exemplo:

```bash
cp .env.example .env.local
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Use a URL e a anon key do projeto Supabase correto. A service role key deve ficar apenas em ambiente servidor/local e nunca deve ser exposta no cliente.

### Vincular o projeto remoto

```bash
npx supabase link --project-ref <ref>
```

Substitua `<ref>` pelo Project Ref do projeto Supabase correto. Depois do link, confirme se `supabase/config.toml` continua coerente com o remoto, especialmente `db.major_version`.

### Aplicar migrations

Para aplicar as migrations no projeto remoto vinculado:

```bash
npx supabase db push
```

Para reconstruir o banco local a partir das migrations:

```bash
npx supabase db reset
```

### Regenerar tipos do banco

Depois que o schema estiver aplicado no projeto vinculado:

```bash
npm run db:types
```

## shadcn/ui

Para adicionar componentes:

```bash
npx shadcn@latest add button
```

Para usar componentes:

```tsx
import { Button } from "@/components/ui/button"
```
