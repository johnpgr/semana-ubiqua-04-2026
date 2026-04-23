# TODO

## Status Atual

- [x] Migrations SQL criadas em `supabase/migrations`
- [x] Policies de RLS adicionadas
- [x] Realtime habilitado para `credit_requests`
- [x] Schema alinhado com Supabase Auth via `profiles -> auth.users`
- [x] `npm run db:types` adicionado para gerar os tipos do banco em `lib/supabase/database.types.ts`
- [x] Configuração do projeto Supabase versionada em `supabase/config.toml`
- [x] Implementação do app iniciada além do scaffold padrão

## Próximos Passos

### 1. Configuração do projeto Supabase

- [x] Inicializar `supabase/config.toml` se ainda não existir
- [x] Vincular o repositório ao projeto Supabase correto com `npx supabase link --project-ref <ref>`
- [ ] Aplicar as migrations com `npx supabase db push` ou `npx supabase db reset` localmente
- [x] Executar `npm run db:types` depois que o schema estiver aplicado
- [x] Documentar as variáveis de ambiente necessárias em `.env.example`; preencher `.env.local` manualmente
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 2. Utilitários do cliente Supabase

- [x] Criar `lib/supabase/client.ts`
- [x] Criar `lib/supabase/server.ts`
- [x] Criar `lib/supabase/service.ts`
- [x] Usar os tipos gerados do banco nesses clientes

### 3. Fluxo de autenticação e perfil do usuário

- [x] Adicionar o fluxo de Supabase Auth para o usuário final
- [x] Decidir se a demo vai usar magic link exatamente como no documento ou um fluxo de login de desenvolvimento mais simples
- [x] Construir a página de cadastro para `name`, `cpf` e `mock_profile`
- [x] Adicionar validação de CPF na UI e no servidor
- [x] Inserir em `profiles` após signup/autenticação
- [ ] Criar manualmente ou popular pelo menos um usuário admin com `raw_user_meta_data.role = 'admin'`

### 4. Páginas da jornada do usuário

- [x] Substituir o placeholder de `app/page.tsx` pela landing page
- [x] Adicionar o fluxo de cadastro em `app/cadastro`
- [x] Adicionar o fluxo de nova solicitação em `app/solicitacao`
- [x] Adicionar a página de resultado em `app/resultado/[id]`
- [ ] Adicionar um estado simples de sucesso para a simulação de Pix

### 5. Fluxo de consentimento

- [x] Construir a UI de consentimento com os três escopos: `salary`, `investments`, `cards`
- [x] Persistir os registros de consentimento em `consents`
- [x] Garantir que o fluxo de score não rode sem consentimento salvo
- [x] Exibir os escopos selecionados de volta ao usuário por transparência

### 6. Gerador de dados mockados

- [x] Adicionar `@faker-js/faker`
- [x] Criar `lib/mockData/profiles.ts`
- [x] Implementar os 5 perfis mockados da spec
- [x] Gerar transações sintéticas realistas por solicitação
- [x] Manter os dados gerados coerentes com o `mock_profile` selecionado

### 7. Motor de score

- [x] Criar `lib/scoreEngine/index.ts`
- [x] Adicionar módulos de dimensão para `regularity`, `capacity`, `stability`, `behavior` e `dataQuality`
- [x] Implementar a agregação do score de `0-1000`
- [x] Implementar o mapeamento de decisão: `approved`, `approved_reduced`, `further_review`, `denied`
- [x] Implementar o cálculo dinâmico de limite sugerido
- [x] Retornar `reasons` legíveis por humanos e um breakdown completo do score

### 8. Orquestração de score via Server Action

- [x] Criar Server Action para processar a análise de crédito sem API route
- [x] Validar autenticação, autorização e `requestId` dentro da action
- [x] Carregar solicitação, perfil e consentimento
- [x] Impedir análise sem consentimento salvo
- [x] Gerar transações mockadas e inseri-las com o cliente service-role
- [x] Calcular o score e salvá-lo em `scores`
- [x] Atualizar `credit_requests.status`, `decision`, `approved_amount` e `decided_at`
- [x] Registrar entradas de auditoria para ações importantes

### 9. Painel admin

- [ ] Adicionar `app/admin/page.tsx` protegido
- [ ] Adicionar middleware ou proteção equivalente para rotas exclusivas de admin
- [ ] Carregar a lista de solicitações ordenada das mais novas para as mais antigas
- [ ] Assinar `credit_requests` via Supabase Realtime
- [ ] Adicionar filtros por status
- [ ] Adicionar drill-down de uma solicitação com perfil, consentimento, transações, score e reasons
- [ ] Adicionar gráficos de distribuição de score e métricas de decisão

### 10. Documentos e storage

- [ ] Criar o bucket do Supabase Storage para documentos
- [x] Adicionar policies de storage compatíveis com o modelo de acesso do app
- [ ] Construir o fluxo opcional de upload de documentos
- [ ] Persistir os metadados dos uploads em `documents`

### 11. UX e polimento

- [ ] Adicionar estados de loading, vazio e erro ao longo do fluxo
- [ ] Fazer os fluxos principais do usuário e do admin funcionarem em larguras mobile >= `360px`
- [x] Manter a página de resultado focada em decisão, reasons e valor aprovado
- [ ] Polir a experiência realtime do admin para que inserts e updates fiquem claros durante a demo

### 12. Validação e testes

- [ ] Adicionar testes unitários para validação de CPF
- [ ] Adicionar testes unitários para as regras do motor de score
- [ ] Adicionar pelo menos um teste por perfil mockado para verificar a faixa de score esperada
- [ ] Verificar manualmente o RLS com contextos anon/autenticado/admin
- [ ] Executar `npm run typecheck`
- [ ] Executar `npm run lint`

### 13. Documentação

- [x] Adicionar um `README.md` com setup, variáveis de ambiente, comandos do Supabase e fluxo de desenvolvimento local
- [x] Documentar como resetar e reaplicar as migrations
- [x] Documentar como regenerar `database.types.ts`
- [x] Documentar a visão consolidada v4 em `docs/opencred-v4.md`
- [ ] Documentar o roteiro de demo para os 5 perfis mockados

### 14. Crédito progressivo

- [ ] Definir modelo de níveis de limite progressivo
- [ ] Definir critérios para evolução de limite por comportamento observado
- [ ] Definir como ciclos de pagamento futuros afetam confiança e limite
- [ ] Documentar como score inicial conservador deve impactar a primeira concessão

### 15. Fraud Score e antifraude comportamental

- [ ] Definir contrato do futuro Fraud Score Engine
- [ ] Planejar sinais de Device Trust, Pattern Repetition e Synthetic Income Detector
- [ ] Definir classificação de risco de fraude: baixo, moderado, alto e crítico
- [ ] Definir como Credit Score e Fraud Score serão combinados na decisão final
- [ ] Mapear consentimentos necessários para sinais sensíveis futuros

### 16. Monitoramento pós-crédito

- [ ] Definir estados de risco pós-crédito
- [ ] Planejar rotina de reavaliação contínua de score e risco
- [ ] Definir alertas preventivos antes de atraso
- [ ] Planejar revisão de limite e renegociação conforme mudança de risco

### 17. Explicabilidade jurídica

- [ ] Criar catálogo de reasons juridicamente claras para aprovação, redução, revisão e negativa
- [ ] Definir quais fatores principais devem ser exibidos ao usuário
- [ ] Documentar quando uma decisão foi automática ou exige revisão adicional
- [ ] Revisar consentimentos caso novos dados sensíveis sejam usados futuramente

### 18. Comunicação oficial por email

- [ ] Definir templates de email para decisão de crédito
- [ ] Definir templates de transparência e explicabilidade
- [ ] Definir templates de risco, segurança e operação
- [ ] Planejar trilha de auditoria para comunicações enviadas

### 19. Integrações futuras com parceiros

- [ ] Definir contrato para receber indicadores agregados de parceiros
- [ ] Planejar uso de score de desempenho, regularidade, atividade e confiança externa
- [ ] Documentar limites de uso de dados brutos versus indicadores processados
- [ ] Mapear impacto de indicadores externos no Credit Score e Fraud Score

## Ordem Sugerida de Implementação

1. Configuração do Supabase e das variáveis de ambiente
2. Clientes Supabase tipados
3. Auth + criação de `profiles`
4. Páginas de cadastro + solicitação + consentimento
5. Gerador de dados mockados
6. Motor de score
7. `/api/score`
8. Página de resultado
9. Dashboard admin com realtime
10. Uploads de storage, testes e README
11. Crédito progressivo e reavaliação de limite
12. Fraud Score e antifraude comportamental
13. Monitoramento pós-crédito e comunicação por email
14. Integrações futuras com parceiros por indicadores
