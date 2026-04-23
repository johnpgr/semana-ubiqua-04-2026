# OpenCred - Documento Tecnico Consolidado v4.0

Plataforma de credito progressivo para autonomos com score dinamico, antifraude comportamental e monitoramento continuo.

Hackathon Semana Ubiqua - Cenario Open Finance

## Sumario executivo

O OpenCred e uma plataforma web de credito digital voltada para autonomos, trabalhadores informais, motoristas de aplicativo, entregadores, freelancers e outros perfis que enfrentam dificuldade de acesso a credito em modelos tradicionais.

A solucao substitui uma analise centrada apenas em renda formal e historico bancario classico por uma avaliacao contextual baseada em comportamento financeiro, consistencia de fluxo e sinais alternativos de confianca.

Na visao v4, o OpenCred deixa de ser apenas um sistema de aprovacao pontual e passa a operar como uma plataforma de credito progressivo. O primeiro limite deve ser conservador, e a confianca do usuario deve crescer conforme seu comportamento real e observado ao longo do tempo.

Essa evolucao responde a novas preocupacoes de negocio:

- inadimplencia causada por aprovacao permissiva demais;
- fraude por multiplas contas e manipulacao artificial de movimentacoes;
- falta de explicacao clara em negativas ou limites reduzidos;
- necessidade de monitorar risco mesmo depois da concessao;
- necessidade de preparar a arquitetura para regulacao, escala e parceiros.

## Objetivo

O OpenCred deve oferecer credito digital inclusivo capaz de:

- avaliar usuarios com base em comportamento financeiro real e dados alternativos;
- comecar com concessoes conservadoras e evoluir limite progressivamente;
- recalcular risco ao longo da vida do usuario;
- detectar sinais de fraude e manipulacao de fluxo financeiro;
- comunicar decisoes de forma clara, compreensivel e juridicamente adequada;
- manter uma arquitetura modular e adaptavel a futuras integracoes.

## Proposta de valor

Credito progressivo para autonomos, com score dinamico, antifraude comportamental, monitoramento continuo e explicacoes claras ao usuario.

Essa proposta atende diretamente:

- Head de Risco: score mais conservador, contextual e adaptavel.
- Seguranca: identificacao de dispositivos, padroes repetidos e correlacao entre contas.
- Juridico: explicabilidade clara e uso de dados dentro do consentimento.
- Operacao: monitoramento pos-credito e alertas antes do atraso.
- Investidor: arquitetura escalavel e adaptavel.
- Parceiro: fornecimento de indicadores agregados em vez de dados brutos.

## Escopo do MVP evoluido

O MVP continua sendo mockado. Nao ha integracao real com Open Finance regulado, Pix, bureaus externos ou parceiros. Mesmo assim, ele deve representar de forma convincente o comportamento de um produto real.

### O MVP entrega

- landing page explicando a proposta de valor;
- autenticacao e cadastro;
- criacao de perfil do usuario;
- solicitacao de credito;
- consentimento granular;
- geracao de dados sinteticos coerentes com perfis financeiros;
- motor de score financeiro;
- decisao de credito com limite sugerido;
- explicacao legivel da decisao;
- arquitetura preparada para score progressivo;
- base conceitual para fraud score e monitoramento posterior;
- painel administrativo planejado para visualizacao e operacao;
- comunicacao por email como canal formal de transparencia e alertas.

### Fora do MVP

- integracao real com Open Finance;
- integracao real com Pix;
- integracao real com bureaus externos;
- antifraude com fingerprint avancado real;
- monitoramento operacional com envio real de emails automatizados;
- cobranca e renegociacao reais;
- machine learning em producao;
- integracao real com parceiros de delivery, bancos ou plataformas externas.

## Evolucao conceitual

Antes, o fluxo principal era:

```txt
solicitacao -> score -> decisao
```

Agora, a direcao funcional passa a ser:

```txt
cadastro -> consentimento -> score inicial conservador -> concessao limitada -> observacao de comportamento -> reavaliacao continua -> ajuste de limite e risco
```

O OpenCred evolui de um avaliador pontual para um ecossistema de risco e confianca.

## Arquitetura logica

A arquitetura base permanece como um monolito full-stack em Next.js com Supabase para persistencia, autenticacao, realtime e storage.

### Stack principal

- Framework: Next.js App Router
- Linguagem: TypeScript strict
- UI: Tailwind CSS e shadcn/ui
- Banco: PostgreSQL via Supabase
- Auth: Supabase Auth
- Realtime: Supabase Realtime
- Storage: Supabase Storage
- Validacao: Zod
- Graficos: Recharts
- Mock data: `@faker-js/faker`
- Hospedagem: Vercel e Supabase Cloud

### Componentes logicos

- Frontend do usuario: cadastro, consentimento, solicitacao e resultado.
- Frontend administrativo: lista de solicitacoes, detalhes da analise, dashboards e monitoramento.
- Camada de persistencia: `profiles`, `credit_requests`, `consents`, `transactions`, `scores`, `documents` e `audit_logs`.
- Mock Data Engine: geracao de transacoes sinteticas por perfil.
- Credit Score Engine: calculo do score financeiro, breakdown por dimensao, decisao e limite sugerido.
- Fraud Score Engine, planejado: correlacao entre contas, risco por dispositivo, padroes repetidos e renda artificial.
- Risk Monitor, planejado: reavaliacao continua, alteracao de risco, suporte a alertas e renegociacao.

## Credito progressivo

Ser aprovado nao significa receber um valor alto imediatamente. Significa ganhar acesso a uma primeira oportunidade de credito, em valor reduzido e controlado.

### Niveis de progressao

- Nivel 1 - Entrada: score suficiente, limite inicial pequeno e foco em observar comportamento real.
- Nivel 2 - Confianca inicial: pagamentos em dia, padrao de renda mantido, ausencia de fraude e pequeno aumento de limite.
- Nivel 3 - Cliente confiavel: multiplos ciclos bem pagos, historico estavel, sinais de risco reduzidos e aumento progressivo mais forte.
- Nivel 4 - Cliente premium: longo historico positivo, estabilidade sustentada, menor risco operacional e melhores condicoes.

### Beneficios

- reduz risco inicial;
- evita superexposicao na primeira concessao;
- melhora a precisao da confianca ao longo do tempo;
- incentiva bom comportamento;
- torna o score mais conservador e responsavel.

## Credit Score Engine

O Credit Score Engine avalia o comportamento financeiro do usuario.

### Entrada

O motor recebe transacoes financeiras sinteticas ou persistidas com entradas, saidas, categorias, descricoes, datas e origem dos dados.

### Dimensoes

O score vai de 0 a 1000 e considera cinco dimensoes:

- Regularity: frequencia e consistencia das entradas.
- Capacity: capacidade estimada de pagamento com base em renda, saidas e sobra recorrente.
- Stability: volatilidade do fluxo e interrupcoes relevantes.
- Behavior: organizacao financeira, relacao entre entradas e saidas e estrutura de uso.
- DataQuality: quantidade, profundidade e confiabilidade do historico.

### Saida

O motor retorna score final, decisao, limite sugerido, reasons legiveis por humanos, breakdown por dimensao e metricas agregadas.

### Principio de conservadorismo

As faixas podem ser refinadas ao longo do projeto, mas o principio central deve ser preservado: historico curto, instavel ou suspeito nao deve ser premiado.

## Fraud Score e antifraude comportamental

Fraude e risco financeiro devem ser avaliados separadamente:

- Credit Score: mede capacidade financeira.
- Fraud Score: mede suspeita de manipulacao ou fraude.

Essa separacao evita que uma boa movimentacao aparente resulte em aprovacao automatica quando existem sinais fortes de comportamento malicioso.

### Modulos planejados

Device Trust:

- mesmo dispositivo em multiplas contas;
- mesmo IP;
- mesma assinatura tecnica;
- criacao em lote;
- padroes de uso coincidentes.

Pattern Repetition:

- comportamento semelhante entre contas;
- horarios repetidos;
- sequencias de cadastro parecidas;
- movimentacoes artificialmente similares.

Synthetic Income Detector:

- entrada e saida espelhadas;
- fluxo circular;
- picos antes da solicitacao;
- baixa retencao de saldo;
- movimentacao artificial para inflar score.

### Saida planejada

O risco de fraude pode ser classificado como baixo, moderado, alto ou critico.

A combinacao entre Credit Score e Fraud Score pode produzir aprovacao, aprovacao com revisao, revisao manual obrigatoria ou negativa por suspeita.

## Monitoramento pos-credito

A concessao de credito inicia uma fase de observacao. O OpenCred deve acompanhar o comportamento apos a liberacao para antecipar risco e apoiar operacao.

### Objetivos

- acompanhar queda de renda;
- detectar piora do padrao financeiro;
- detectar explosao de saidas;
- detectar novos sinais de fraude;
- antecipar atraso;
- orientar renegociacao;
- recalcular score continuamente.

### Estados de risco

- risco baixo;
- risco moderado;
- risco alto;
- fraude provavel.

### Acoes possiveis

- manter limite atual;
- impedir aumento;
- reduzir exposicao futura;
- sinalizar revisao;
- acionar operacao;
- sugerir renegociacao;
- enviar comunicacao preventiva por email.

## Explicabilidade e juridico

Toda decisao deve gerar pelo menos uma justificativa compreensivel. Isso e especialmente importante para negativas, revisoes e limites reduzidos.

### Exemplos de reasons

- Seu historico de movimentacao ainda apresenta instabilidade.
- Seu padrao de renda ainda nao foi consistente o suficiente.
- Seu historico atual e curto para liberar um valor maior.
- Detectamos movimentacoes incomuns e sua solicitacao precisa de revisao.
- Voce foi aprovado, mas com limite reduzido, porque ainda esta em fase inicial de confianca.

### Transparencia

A solucao deve deixar claro quais fatores afetaram a decisao, que tipo de dado foi considerado, quais dados exigem consentimento, quando a decisao foi automatica e quando houve revisao adicional.

### Consentimento

Se o sistema evoluir para usar localizacao, fingerprint, padrao de uso ou indicadores externos, esses dados devem estar cobertos por consentimento adequado.

## Comunicacao oficial por email

O email e o canal oficial de comunicacao formal do OpenCred. Essa decisao reduz dependencias externas e fortalece a trilha juridica, operacional e de auditoria.

### Usos

- decisao de credito;
- explicacao de negativa;
- explicacao de aprovacao com limite reduzido;
- mudanca relevante de score;
- atividade suspeita;
- vencimento proximo;
- atraso;
- renegociacao;
- transparencia sobre uso de dados.

### Tipos de email

- Decisao: aprovado, aprovado com limite reduzido, revisao necessaria ou negado.
- Transparencia: fatores da decisao, reforco de explicabilidade e comunicacao juridica.
- Risco: mudanca no comportamento financeiro, alerta antes do atraso e possivel revisao de limite.
- Seguranca: atividade incomum, conta em revisao e necessidade de confirmacao.
- Operacional: vencimento, atraso e renegociacao.

## Integracao com parceiros

O OpenCred deve se preparar para parceiros que nao fornecem dados brutos, mas sim indicadores processados.

### Indicadores esperados

- score de desempenho;
- indicadores de regularidade;
- indice de atividade;
- nivel resumido de confianca;
- metricas agregadas de uso.

### Beneficios

- reduz exposicao a dados sensiveis;
- simplifica integracao;
- facilita compliance;
- mantem valor de negocio;
- enriquece o score sem exigir dados brutos.

## Requisitos funcionais consolidados

- RF01: cadastro do usuario.
- RF02: validacao de CPF no cliente e no servidor.
- RF03: consentimento granular.
- RF04: solicitacao de credito.
- RF05: geracao de dados mockados.
- RF06: calculo do Credit Score.
- RF07: decisao de credito.
- RF08: calculo do limite sugerido.
- RF09: explicacao da decisao.
- RF10: historico persistente.
- RF11: reavaliacao de score.
- RF12: mecanismo de progressao de limite.
- RF13: Fraud Score Engine.
- RF14: correlacao entre usuarios.
- RF15: monitoramento pos-credito.
- RF16: alertas por email.
- RF17: painel administrativo.

## Regras de negocio consolidadas

- RN01: nenhuma analise ocorre sem consentimento persistido.
- RN02: o score inicial deve ser conservador.
- RN03: o limite inicial nunca deve assumir confianca maxima.
- RN04: aumento de limite depende de comportamento observado ao longo do tempo.
- RN05: fraude e credito devem ser avaliados separadamente.
- RN06: movimentacao artificial deve penalizar risco.
- RN07: historico insuficiente reduz confianca.
- RN08: toda decisao deve gerar explicacao clara.
- RN09: novos dados sensiveis exigem consentimento adequado.
- RN10: o sistema deve permitir reavaliacao continua do risco.
- RN11: emails sao o canal oficial de comunicacao formal com o usuario.
- RN12: indicadores externos podem enriquecer a analise mesmo sem dados brutos.

## Estado atual

O projeto ja possui configuracao do Supabase, migrations, clientes Supabase tipados, auth e perfil, cadastro, solicitacao, resultado, consentimento, mock data, score engine e documentacao inicial.

Ainda sao etapas importantes: API route de score, painel administrativo, upload e storage, testes e polimento geral do fluxo.

## Roadmap tecnico

### Curto prazo

- integrar `/api/score`;
- persistir transacoes e score no banco;
- atualizar `credit_requests`;
- registrar auditoria;
- concluir fluxo admin;
- concluir upload de documentos.

### Medio prazo

- implementar Fraud Score persistido;
- implementar monitoramento pos-credito;
- criar rotina de reavaliacao de risco;
- estruturar notificacoes por email.

### Longo prazo

- integrar parceiros externos;
- suportar multiplos paises e regulacoes;
- adicionar modelos mais avancados de previsao;
- reforcar antifraude em producao com device intelligence real.

## Conclusao

O OpenCred evolui de um MVP de credito mockado para uma proposta mais madura: uma plataforma de credito progressivo e adaptativo, com analise financeira, antifraude comportamental, monitoramento continuo e explicabilidade juridica.

Essa direcao reduz risco de inadimplencia com concessao mais conservadora, melhora seguranca com deteccao de fraude e cruzamento de sinais, fortalece transparencia com reasons claras e comunicacao por email, e prepara a solucao para crescer em complexidade e escala.
