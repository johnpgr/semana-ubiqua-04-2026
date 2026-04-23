# Validação Manual de RLS

Este checklist cobre os cenários principais de Row Level Security do OpenCred com base nas policies atuais em [0002_rls.sql](../supabase/migrations/0002_rls.sql) e [0006_documents_storage.sql](../supabase/migrations/0006_documents_storage.sql).

## Escopos atuais

- `anon`: não deve acessar dados protegidos das tabelas de negócio.
- `authenticated` comum: só deve acessar os próprios dados.
- `admin`: pode ler dados das contas e solicitações, conforme `public.is_admin()`.
- `service_role`: bypass de RLS para operações internas do servidor.

## Policies cobertas hoje

- `profiles`: select/update do próprio usuário ou admin; insert do próprio usuário.
- `credit_requests`: select do próprio usuário ou admin; insert do próprio usuário; update só admin.
- `consents`: select/insert vinculados às requests do próprio usuário ou admin para leitura.
- `transactions`: select vinculado à request do próprio usuário ou admin.
- `scores`: select vinculado à request do próprio usuário ou admin.
- `documents` (tabela): select do próprio usuário ou admin; insert/update/delete do próprio usuário ou admin conforme vínculo com `credit_requests`.
- `audit_logs`: leitura apenas admin.
- `storage.objects` do bucket `documents`: leitura/escrita condicionada a ownership da pasta e request do usuário, com exceção de admin para leitura/update/delete.

## Checklist manual

### 1. Contexto `anon`

Validar com cliente sem login ou SQL/REST sem JWT autenticado:

- `select * from profiles`
- `select * from credit_requests`
- `select * from consents`
- `select * from transactions`
- `select * from scores`
- `select * from documents`
- leitura em `storage.objects` do bucket `documents`

Resultado esperado:

- acesso negado ou lista vazia nas tabelas protegidas;
- sem leitura de arquivos do bucket privado.

### 2. Contexto `authenticated` comum

Usar um usuário comum com pelo menos:

- um `profile` próprio;
- uma `credit_request` própria;
- uma `credit_request` de outro usuário para contraprova.

Validar:

- consegue ler o próprio `profile`;
- não consegue ler `profile` de outro usuário;
- consegue inserir `credit_requests` com `user_id = auth.uid()`;
- não consegue inserir `credit_requests` com `user_id` diferente;
- consegue ler `consents`, `transactions`, `scores` e `documents` ligados à própria request;
- não consegue ler os mesmos dados de request alheia;
- não consegue ler `audit_logs`;
- consegue fazer upload/leitura no bucket `documents` apenas dentro do caminho `<auth.uid()>/<request_id>/...` quando a request é sua.

### 3. Contexto `admin`

Usar um usuário autenticado com `raw_user_meta_data.role = 'admin'`.

Validar:

- consegue ler `profiles`, `credit_requests`, `consents`, `transactions`, `scores`, `documents` e `audit_logs`;
- consegue fazer `update` em `credit_requests`;
- consegue ler arquivos `storage.objects` do bucket `documents` de outros usuários;
- continua sem depender de service role para leitura administrativa.

## Como executar na prática

### Opção A — Supabase Studio / SQL Editor

Boa para inspeção rápida de dados e policies. Para validar RLS de verdade, prefira sessões com JWT diferentes ou clientes distintos, porque queries executadas como owner/service role podem mascarar o comportamento real.

### Opção B — Cliente Supabase por contexto

Criar três clientes separados:

- `anon`: apenas `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `authenticated`: mesmo cliente anon após login
- `admin`: login com usuário admin

Executar consultas com cada sessão e comparar o resultado.

## Status desta validação na task 12

Nesta task, a revisão foi documental e baseada nas migrations versionadas. A validação manual completa depende do ambiente Supabase com:

- usuários reais de teste;
- pelo menos um usuário admin;
- requests/dados semeados para comparar ownership;
- execução com sessões `anon`, `authenticated` e `admin`.

Sem esse ambiente preparado, não é honesto marcar a verificação manual como totalmente executada no runtime. O checklist acima cobre o que deve ser rodado e o resultado esperado.
