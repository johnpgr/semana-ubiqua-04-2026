# Roadmap estrategico - Backlog 20.1 a 20.5

## Objetivo

Consolidar, em um unico lugar, o que o OpenCred ja tem pronto hoje nos cinco eixos estrategicos da proxima fase (TODO.md, secao 20), o que esta parcialmente endereca, e quais sao os proximos passos concretos. Este documento nao implementa nada sozinho: ele organiza o backlog para que evolucoes futuras tenham referencia curta e direta.

As cinco frentes sao:

1. **20.1** Risco e produto - score conservador, reavaliacao continua, progressao por confianca.
2. **20.2** Fraude e confianca operacional - Credit Score e Fraud Score como eixos separados, device trust, correlacao entre usuarios.
3. **20.3** Operacao e monitoramento pos-credito - alertas preventivos, renegociacao, estados operacionais.
4. **20.4** Compliance, juridico e comunicacao - reasons claras, consentimento expandido, playbook de e-mails.
5. **20.5** Arquitetura, escala e regulacao - contratos modulares, parceiros, multiplos mercados.

## 20.1 - Risco e produto

**Estado atual**

- Score 0-1000 agregado em `lib/scoreEngine` a partir de cinco dimensoes.
- Politica de credito progressivo em `lib/creditProgression` com quatro niveis de confianca e teto conservador para a primeira concessao.
- Documento base: `docs/credito-progressivo.md`.

**Gap**

- Ciclos reais de pagamento e reavaliacao periodica nao existem - nao ha cobranca real, portanto nao ha sinal de adimplencia observado.
- Pesos do motor estao fixos; reavaliacoes com historico pos-concessao precisariam aumentar o peso de `behavior` e reduzir `dataQuality`.

**Proximos passos concretos**

1. Definir evento de reavaliacao disparavel a partir de nova solicitacao e, depois, por janela temporal.
2. Adicionar conjunto alternativo de pesos "reavaliacao" que aumenta `behavior` quando ja existe historico aprovado.

## 20.2 - Fraude e confianca operacional

**Estado atual**

- `lib/fraudScore` produz Fraud Score independente do Credit Score, com niveis `low`, `moderate`, `high`, `critical`.
- Decisao final combina os dois eixos em `applyFraudDecisionPolicy`.
- Sinais de Device Trust basicos ja consumidos a partir de `consents.user_agent` e `consents.ip_address`.
- Documento base: `docs/fraud-score-antifraude.md`.

**Gap**

- Sem fingerprint estavel de dispositivo alem de UA + IP.
- Sem correlacao entre usuarios para detectar clusters.
- Deteccao de renda sintetica e de padrao repetido ainda sao heuristicas em transacoes mockadas.

**Proximos passos concretos**

1. Fingerprint estavel: hash de `user_agent` + familia de IP, armazenado por solicitacao, e verificacao de colisao cross-user.
2. Expansao do catalogo de consentimentos para cobrir telemetria de dispositivo de forma explicita antes de coletar sinais mais ricos.

## 20.3 - Operacao e monitoramento pos-credito

**Estado atual**

- `lib/postCreditMonitoring` emite nivel de risco, alertas preventivos, recomendacoes de limite e status de elegibilidade por solicitacao.
- O bundle de e-mails ja cria comunicacoes de risco e operacionais quando o risco pos-credito escala.
- Documento base: `docs/monitoramento-pos-credito.md`.

**Gap**

- Nao ha cron ou fluxo real de reavaliacao continua depois da concessao.
- Nao ha workflow executavel de renegociacao, apenas sinalizacao.

**Proximos passos concretos**

1. Amarrar os alertas existentes a e-mails reais via a Edge Function `send-email` (ja pronta no MVP).
2. Introduzir uma Server Action de "reavaliar relacionamento" que reexecuta o monitoramento com transacoes atualizadas.

## 20.4 - Compliance, juridico e comunicacao

**Estado atual**

- `lib/explainability` gera reasons, fatores principais, avisos de dados sensiveis e aviso de consentimento futuro.
- `lib/emailCommunication` gera bundle estruturado (decisao, transparencia, risco, seguranca, operacao).
- Envio real de e-mails via Edge Function Supabase `send-email`, com modo dry-run sem SMTP configurado.
- Tela de consentimento agora renderiza os escopos agrupados por categoria, pronta para receber novas categorias sem redesenho.
- Documentos base: `docs/explicabilidade-juridica.md`, `docs/comunicacao-email-oficial.md`.

**Gap**

- Apenas a categoria "financeiro" esta no catalogo de escopos. Novas categorias (telemetria de dispositivo, compartilhamento com parceiros) estao previstas mas nao acionadas.
- Reasons nao tem teste de legibilidade formalizado alem do novo guard contra identificadores internos.

**Proximos passos concretos**

1. Adicionar categoria "telemetria" ao catalogo de consentimentos quando o Fraud Score passar a consumir sinais de device mais ricos.
2. Ampliar a suite de testes para garantir que cada reason cite pelo menos um fator do catalogo.

## 20.5 - Arquitetura, escala e regulacao

**Estado atual**

- Motores financeiro, fraude, progressao e monitoramento estao modularizados em libs independentes.
- Parceiros externos entram via `lib/partnerIndicators` com indicadores processados (nao dados brutos).
- Cada motor expoe `engineVersion: "1.0.0"` como comeco de contrato versionado.
- Documento base: `docs/integracoes-parceiros-indicadores.md`.

**Gap**

- Nao ha suporte a multiplos mercados/regulacoes paralelas.
- Nao ha versao maior que 1.0 em nenhum motor; o mecanismo de evolucao existe mas ainda nao foi exercitado.

**Proximos passos concretos**

1. Evoluir `engineVersion` para valor emitido por arquivo dedicado por motor e registrar breaking changes em changelog dentro de cada lib.
2. Documentar contrato publico de indicadores de parceiros com versao e compatibilidade minima.

## Fora de escopo nesta fase

Os itens abaixo estao conscientemente adiados:

- Cobranca real, ciclos de pagamento reais e renegociacao executavel (20.1 e 20.3).
- Deteccao de cluster entre usuarios em escala populacional (20.2).
- Canais fora de e-mail (SMS, voz) para alertas (20.3).
- Camadas regulatorias multi-regiao (20.5).
- Novos escopos de consentimento (telemetria, compartilhamento com parceiros) antes do pipeline de fraude efetivamente precisar (20.4).
