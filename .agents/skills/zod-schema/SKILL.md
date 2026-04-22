---
name: zod-schema
description: Convention for defining Zod validation schemas in this codebase — PascalCase naming, co-located types, centralized in validation/.
---

# Zod Schema Convention

All Zod schemas live in `apps/web/validation/` organized by domain (e.g. `auth.ts`, `prova.ts`).

## Naming

- **PascalCase**, no `Schema` suffix: `Email`, `Password`, `Name` — not `emailSchema`
- Prefix with context when ambiguous: `LoginPassword` vs `Password`

## Co-located type export

Every schema must export a matching type using `z.infer`. TypeScript allows a value and type to share the same name:

```ts
import * as z from "zod/v4"

export const Email = z.string().min(1, "Email é obrigatório").email("Email inválido")
export type Email = z.infer<typeof Email>
```

This lets consumers use the same identifier as both a runtime validator and a type:

```ts
import { Email } from "@/validation/auth"

// As a type
function greet(email: Email) { ... }

// As a runtime validator
const result = Email.safeParse(input)
```

## Usage with TanStack Form

Use `.safeParse()` in field-level `validators.onBlur`:

```tsx
<form.Field
  name="email"
  validators={{
    onBlur: ({ value }) => {
      const r = Email.safeParse(value)
      return r.success ? undefined : r.error.issues[0]?.message
    },
  }}
>
```

## File organization

```
apps/web/validation/
  auth.ts       # Name, Email, Password, LoginPassword
  prova.ts      # (future) exam-related schemas
  ...
```

One file per domain. Keep schemas atomic (single fields or small objects) — compose with `z.object()` only when needed for form-level or API-level validation.
