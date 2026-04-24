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
- [x] Aplicar as migrations com `npx supabase db push` ou `npx supabase db reset` localmente
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

- [x] Adicionar `app/admin/page.tsx` protegido
- [x] Adicionar middleware ou proteção equivalente para rotas exclusivas de admin
- [x] Carregar a lista de solicitações ordenada das mais novas para as mais antigas
- [x] Assinar `credit_requests` via Supabase Realtime
- [x] Adicionar filtros por status
- [x] Adicionar drill-down de uma solicitação com perfil, consentimento, transações, score e reasons
- [x] Adicionar gráficos de distribuição de score e métricas de decisão

### 10. Documentos e storage

- [x] Criar o bucket do Supabase Storage para documentos
- [x] Adicionar policies de storage compatíveis com o modelo de acesso do app
- [x] Construir o fluxo opcional de upload de documentos
- [x] Persistir os metadados dos uploads em `documents`

### 11. UX e polimento

- [x] Adicionar estados de loading, vazio e erro ao longo do fluxo
- [x] Fazer os fluxos principais do usuário e do admin funcionarem em larguras mobile >= `360px`
- [x] Manter a página de resultado focada em decisão, reasons e valor aprovado
- [x] Polir a experiência realtime do admin para que inserts e updates fiquem claros durante a demo

### 12. Validação e testes

- [x] Adicionar testes unitários para validação de CPF
- [x] Adicionar testes unitários para as regras do motor de score
- [x] Adicionar pelo menos um teste por perfil mockado para verificar a faixa de score esperada
- [x] Documentar checklist de validação manual de RLS com contextos anon/autenticado/admin em `docs/rls-validation.md`
- [ ] Executar manualmente a validação de RLS com usuários reais `anon`, autenticado comum e admin no ambiente Supabase
- [x] Executar `npm run typecheck`
- [x] Executar `npm run lint`

### 13. Documentação

- [x] Adicionar um `README.md` com setup, variáveis de ambiente, comandos do Supabase e fluxo de desenvolvimento local
- [x] Documentar como resetar e reaplicar as migrations
- [x] Documentar como regenerar `database.types.ts`
- [x] Documentar a visão consolidada v4 em `docs/opencred-v4.md`
- [x] Documentar o roteiro de demo para os 5 perfis mockados em `docs/demo-roteiro-mock-profiles.md`

### 14. Crédito progressivo

- [x] Definir modelo de níveis de limite progressivo
- [x] Definir critérios para evolução de limite por comportamento observado
- [x] Definir como ciclos de pagamento futuros afetam confiança e limite
- [x] Documentar como score inicial conservador deve impactar a primeira concessão
- [x] Consolidar a diretriz de crédito progressivo em `docs/credito-progressivo.md`
- [x] Implementar MVP de crédito progressivo no fluxo real com `lib/creditProgression`, ajuste de limite e exibição em resultado/admin

### 15. Fraud Score e antifraude comportamental

- [x] Definir contrato do futuro Fraud Score Engine
- [x] Planejar sinais de Device Trust, Pattern Repetition e Synthetic Income Detector
- [x] Definir classificação de risco de fraude: baixo, moderado, alto e crítico
- [x] Definir como Credit Score e Fraud Score serão combinados na decisão final
- [x] Mapear consentimentos necessários para sinais sensíveis futuros
- [x] Consolidar a diretriz de Fraud Score e antifraude em `docs/fraud-score-antifraude.md`
- [x] Implementar MVP de Fraud Score no fluxo real com `lib/fraudScore`, ajuste de decisão e exibição em resultado/admin

### 16. Monitoramento pós-crédito

- [x] Definir estados de risco pós-crédito
- [x] Planejar rotina de reavaliação contínua de score e risco
- [x] Definir alertas preventivos antes de atraso
- [x] Planejar revisão de limite e renegociação conforme mudança de risco
- [x] Consolidar a diretriz de monitoramento pós-crédito em `docs/monitoramento-pos-credito.md`
- [x] Implementar MVP de monitoramento pós-crédito no fluxo real com `lib/postCreditMonitoring`, alertas e exibição em resultado/admin

### 17. Explicabilidade jurídica

- [x] Criar catálogo de reasons juridicamente claras para aprovação, redução, revisão e negativa
- [x] Definir quais fatores principais devem ser exibidos ao usuário
- [x] Documentar quando uma decisão foi automática ou exige revisão adicional
- [x] Revisar consentimentos caso novos dados sensíveis sejam usados futuramente
- [x] Consolidar a diretriz de explicabilidade jurídica em `docs/explicabilidade-juridica.md`
- [x] Implementar MVP de explicabilidade jurídica no fluxo real com `lib/explainability`, fatores principais e exibição em resultado/admin

### 18. Comunicação oficial por email

- [x] Definir templates de email para decisão de crédito
- [x] Definir templates de transparência e explicabilidade
- [x] Definir templates de risco, segurança e operação
- [x] Planejar trilha de auditoria para comunicações enviadas
- [x] Consolidar a diretriz de comunicação oficial por email em `docs/comunicacao-email-oficial.md`
- [x] Implementar MVP de comunicação oficial com `lib/emailCommunication`, geração de bundle, preview em resultado/admin e trilha em `audit_logs`

### 19. Integrações futuras com parceiros

- [x] Definir contrato para receber indicadores agregados de parceiros
- [x] Planejar uso de score de desempenho, regularidade, atividade e confiança externa
- [x] Documentar limites de uso de dados brutos versus indicadores processados
- [x] Mapear impacto de indicadores externos no Credit Score e Fraud Score
- [x] Consolidar a diretriz de integrações com parceiros em `docs/integracoes-parceiros-indicadores.md`
- [x] Implementar MVP de indicadores de parceiros com `lib/partnerIndicators`, impacto controlado em crédito/fraude e exibição em resultado/admin

### 20. Backlog estratégico da próxima fase

#### 20.1 Risco e produto

- [ ] Tornar o score inicial mais conservador por padrão para primeiras concessões
- [ ] Aumentar o peso de comportamento observado ao longo do tempo em reavaliações futuras
- [ ] Definir regras de progressão de limite baseadas em confiança acumulada
- [ ] Estruturar reavaliação contínua de score após concessão de crédito
- [ ] Definir critérios para ajuste de limite conforme histórico de pagamento e manutenção de renda

#### 20.2 Fraude e confiança operacional

- [ ] Separar formalmente Credit Score e Fraud Score como dois eixos de decisão
- [ ] Preparar decisão final considerando risco financeiro e risco de fraude em conjunto
- [ ] Preparar suporte para device trust e device risk
- [ ] Permitir correlação futura por dispositivo, IP e origem técnica
- [ ] Cruzar dados entre usuários para identificar comportamento excessivamente semelhante
- [ ] Sinalizar clusters suspeitos de contas relacionadas
- [ ] Detectar fluxo circular e movimentação artificial de renda
- [ ] Detectar entradas e saídas espelhadas com padrão suspeito
- [ ] Marcar tentativas de inflar artificialmente renda antes da análise

#### 20.3 Operação e monitoramento pós-crédito

- [ ] Reavaliar risco depois da concessão de crédito
- [ ] Detectar piora relevante do perfil financeiro após liberação
- [ ] Preparar alertas preventivos antes de atraso ou deterioração forte do risco
- [ ] Estruturar apoio operacional à renegociação com base em sinais de risco
- [ ] Definir estados operacionais de monitoramento pós-crédito e suas ações esperadas

#### 20.4 Compliance, jurídico e comunicação

- [ ] Refinar reasons para ficarem mais claras, compreensíveis e não técnicas
- [ ] Reforçar explicabilidade jurídica para negativas, revisões e limites reduzidos
- [ ] Ampliar transparência sobre quais dados foram usados em cada decisão
- [ ] Preparar consentimento expandido para sinais financeiros, comportamentais e externos
- [ ] Separar melhor os blocos de consentimento por categoria de dado utilizado
- [ ] Planejar emails de decisão de crédito
- [ ] Planejar emails de transparência sobre score e uso de dados
- [ ] Planejar emails de risco e alerta preventivo
- [ ] Planejar emails de segurança para comportamento suspeito
- [ ] Planejar emails operacionais e de cobrança

#### 20.5 Arquitetura, escala e regulação

- [ ] Preparar modularização futura entre motores de score, fraude e monitoramento
- [ ] Deixar a arquitetura adaptável a novos mercados e regulações
- [ ] Preparar suporte a integração com parceiros via indicadores processados
- [ ] Enriquecer análise com indicadores externos sem depender de dados brutos
- [ ] Definir contratos de integração que permitam crescimento com compliance e portabilidade

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
15. Backlog estratégico de risco, fraude, compliance e escala
