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
EMAIL_OPERATIONS_INBOX=
```

Use a URL e a anon key do projeto Supabase correto. A service role key deve ficar apenas em ambiente servidor/local e nunca deve ser exposta no cliente. `EMAIL_OPERATIONS_INBOX` e opcional e define o destinatario das comunicacoes internas (audiencias `operations`, `admin`, `risk`, `security`); quando nao configurado, esses e-mails aparecem como `skipped` em `audit_logs`.

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

### Envio de e-mails

A comunicacao oficial (decisao, transparencia, risco, seguranca, operacao) e enviada por uma Edge Function Supabase em `supabase/functions/send-email`. As credenciais SMTP ficam em Supabase secrets, nao em `.env.local`.

Deploy da funcao:

```bash
npx supabase functions deploy send-email
```

Configurar SMTP (qualquer provedor: Gmail com senha de app, SendGrid, Amazon SES, Resend como SMTP etc.):

```bash
npx supabase secrets set \
  SMTP_HOST=smtp.example.com \
  SMTP_PORT=587 \
  SMTP_USERNAME=usuario \
  SMTP_PASSWORD=senha \
  SMTP_FROM_EMAIL=noreply@example.com \
  SMTP_FROM_NAME="OpenCred"
```

Se as secrets SMTP nao estiverem configuradas, a funcao roda em modo dry-run (registra `email_delivery_dry_run` em `audit_logs` e nao tenta SMTP). Isso mantem o fluxo de analise funcionando em checkouts frescos. Para iterar localmente:

```bash
npx supabase functions serve send-email
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
