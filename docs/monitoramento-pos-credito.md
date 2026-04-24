# Monitoramento Pos-Credito do OpenCred

## Visao geral

O OpenCred nao deve encerrar a avaliacao no momento da concessao. A liberacao do credito marca o inicio de uma fase nova: a observacao continua do comportamento do cliente para proteger a operacao, revisar risco e ajustar exposicao ao longo do tempo.

Essa diretriz existe para responder a quatro necessidades de negocio:

- identificar deterioracao antes do atraso;
- recalcular risco ao longo da vida do cliente;
- ajustar limite e elegibilidade conforme comportamento real;
- preparar acao preventiva e, quando necessario, renegociacao.

Este documento registra diretrizes futuras de produto, risco e operacao. Nao define jobs, automacoes ou implementacao tecnica final. O objetivo e deixar clara a logica futura do monitoramento pos-credito.

## Principios do monitoramento pos-credito

- A concessao nao encerra a analise de risco.
- O cliente deve ser acompanhado de forma proporcional ao risco observado.
- Mudanca de comportamento deve afetar confianca, limite e oferta futura.
- O sistema deve agir antes do atraso quando houver sinais claros de deterioracao.
- A exposicao futura deve refletir comportamento observado, e nao apenas score passado.

## Estados de risco pos-credito

O modelo recomendado usa quatro estados simples e operacionais.

### Risco baixo

**Significado**

O comportamento pos-concessao permanece coerente com a expectativa inicial. O cliente mantem sinais saudaveis de fluxo, pagamento e estabilidade.

**Sinais tipicos**

- pagamentos dentro do esperado;
- manutencao de renda ou fluxo consistente;
- ausencia de sinais fortes de deterioracao;
- ausencia de sinais relevantes de fraude.

**Consequencia operacional futura**

- seguir monitoramento normal;
- manter elegibilidade para evolucao gradual;
- tratar o relacionamento como saudavel.

**Impacto esperado em limite, revisao e relacionamento**

- manutencao do limite atual;
- possibilidade de crescimento futuro;
- maior confianca para nova oferta.

### Risco moderado

**Significado**

A conta ainda nao exige acao de contencao forte, mas ha sinais de atencao suficientes para reduzir automatismo e aumentar observacao.

**Sinais tipicos**

- queda moderada de renda;
- aumento de saidas acima do padrao;
- oscilacao relevante de comportamento financeiro;
- perda parcial de consistencia;
- sinal pontual de risco operacional ou antifraude.

**Consequencia operacional futura**

- aumentar vigilancia;
- reduzir confianca em novas ampliacoes automaticas;
- preparar revisao adicional se houver nova piora.

**Impacto esperado em limite, revisao e relacionamento**

- manutencao conservadora do limite;
- congelamento temporario de crescimento;
- nova oferta sujeita a reavaliacao mais cuidadosa.

### Risco alto

**Significado**

O comportamento indica deterioracao relevante da capacidade, do fluxo ou da confianca operacional. O relacionamento segue ativo, mas com necessidade de acao preventiva mais forte.

**Sinais tipicos**

- queda forte no padrao de renda;
- deterioracao persistente da relacao entre entradas e saidas;
- proximidade de vencimento combinada com piora recente;
- aumento consistente de sinais de risco;
- comportamento anomalo que exige revisao manual.

**Consequencia operacional futura**

- priorizar revisao operacional;
- impedir ampliacao de exposicao;
- preparar resposta preventiva antes de atraso.

**Impacto esperado em limite, revisao e relacionamento**

- congelamento de crescimento;
- reducao de expectativa de nova oferta;
- possivel revisao mais dura de elegibilidade;
- abertura de caminho para abordagem de renegociacao, se fizer sentido.

### Risco critico ou suspeita de fraude

**Significado**

O comportamento sugere perda severa de confianca, deterioracao material ou suspeita relevante de fraude apos a concessao.

**Sinais tipicos**

- combinacao de deterioracao forte com sinais operacionais graves;
- atividade suspeita relevante;
- mudanca brusca e dificil de explicar no comportamento;
- padrao que compromete confianca do relacionamento.

**Consequencia operacional futura**

- acao imediata de risco ou seguranca;
- bloqueio de evolucao automatica;
- priorizacao de revisao manual;
- eventual contencao operacional.

**Impacto esperado em limite, revisao e relacionamento**

- bloqueio de aumento;
- revisao dura de exposicao futura;
- possivel interrupcao de ofertas futuras ate esclarecimento;
- relacionamento tratado em trilha de excecao.

## Reavaliacao continua de score e risco

O monitoramento pos-credito deve reavaliar continuamente tres eixos:

- **Credit Score**
- **Fraud Score**
- **risco operacional pos-credito**

O objetivo nao e reprocessar tudo sem criterio, mas reagir a eventos relevantes e a mudancas de padrao.

### Quando reavaliar

Como diretriz futura, o sistema deve considerar reavaliacao:

- em marcos periodicos do relacionamento;
- antes de nova oferta ou ampliacao de limite;
- antes de vencimentos relevantes;
- quando houver deterioracao observada;
- quando houver sinal importante de fraude ou operacao.

### Eventos que podem disparar reavaliacao

- nova informacao financeira relevante;
- queda repentina no padrao de renda;
- aumento anormal de saidas;
- comportamento inconsistente com historico anterior;
- vencimento proximo com piora recente;
- acionamento de sinal antifraude;
- solicitacao de novo credito ou pedido de aumento de limite.

### Como tratar mudanca positiva

Se o comportamento observado melhora de forma sustentada, a reavaliacao deve considerar:

- aumento de confianca;
- retomada de elegibilidade para nova oferta;
- manutencao ou revisao positiva de limite;
- avancos graduais no relacionamento.

### Como tratar mudanca negativa

Se o comportamento observado piora, a reavaliacao deve considerar:

- reducao de confianca;
- congelamento de crescimento;
- revisao de elegibilidade futura;
- abertura de alerta preventivo;
- encaminhamento operacional quando necessario.

### Impacto em confianca, elegibilidade e oferta futura

O monitoramento continuo deve influenciar:

- confianca acumulada do relacionamento;
- elegibilidade para nova concessao;
- ritmo de progressao de limite;
- necessidade de abordagem preventiva.

Em outras palavras: o risco futuro nao deve depender apenas do score inicial. Ele deve refletir comportamento observado ao longo do tempo.

## Alertas preventivos antes de atraso

O OpenCred deve gerar alertas antes do atraso quando houver sinais relevantes de piora. O objetivo e agir cedo, nao apenas reagir depois da inadimplencia.

## Tipos de alerta preventivo

### 1. Queda repentina de renda

**Objetivo**

Identificar perda de capacidade antes do vencimento.

**Gatilhos conceituais**

- reducao abrupta de entradas;
- desaparecimento de recorrencia esperada;
- perda relevante de estabilidade de fluxo.

**Publico-alvo**

- operacao;
- risco;
- eventualmente o proprio usuario.

**Canal previsto**

- email para comunicacao formal;
- sinalizacao interna para acompanhamento.

### 2. Aumento anormal de saidas

**Objetivo**

Detectar compressao de sobra financeira antes que ela se converta em atraso.

**Gatilhos conceituais**

- saidas acima do padrao historico;
- mudanca brusca na relacao entrada/saida;
- aumento persistente de pressao no fluxo.

**Publico-alvo**

- risco;
- operacao.

**Canal previsto**

- alerta interno;
- email quando fizer sentido comunicar risco crescente ao usuario.

### 3. Mudanca forte de comportamento financeiro

**Objetivo**

Capturar deterioracao qualitativa do relacionamento.

**Gatilhos conceituais**

- perda de consistencia financeira;
- aumento de volatilidade;
- comportamento que destoa do historico recente.

**Publico-alvo**

- risco;
- operacao.

**Canal previsto**

- alerta interno;
- eventual comunicacao formal por email.

### 4. Vencimento proximo com deterioracao recente

**Objetivo**

Combinar risco temporal com piora observada para antecipar atraso provavel.

**Gatilhos conceituais**

- vencimento se aproximando;
- sinais recentes de piora;
- reducao de confianca pouco antes da obrigacao.

**Publico-alvo**

- operacao;
- usuario.

**Canal previsto**

- email preventivo ao usuario;
- alerta interno para acompanhamento.

### 5. Atividade suspeita relevante

**Objetivo**

Antecipar necessidade de revisao quando o risco pos-credito estiver ligado a seguranca ou fraude.

**Gatilhos conceituais**

- sinal antifraude novo ou agravado;
- inconsistencias operacionais relevantes;
- comportamento fora do padrao legitimo esperado.

**Publico-alvo**

- seguranca;
- risco;
- operacao.

**Canal previsto**

- alerta interno prioritario;
- email ao usuario somente quando houver base apropriada e postura juridica clara.

## Revisao de limite e ajuste de exposicao

O sistema futuro nao deve apenas conceder credito. Ele deve revisar exposicao continuamente conforme comportamento real do cliente.

### Manutencao do limite

Deve ocorrer quando:

- o relacionamento permanece saudavel;
- nao ha deterioracao relevante;
- ainda nao existe base suficiente para ampliar de forma segura.

### Congelamento de crescimento

Deve ocorrer quando:

- existe atencao moderada;
- a confianca deixa de crescer;
- o cliente ainda nao piorou o suficiente para acao mais dura, mas ja nao justifica aumento.

### Reducao de exposicao futura

Deve ser considerada quando:

- o risco sobe de forma relevante;
- a capacidade observada piora;
- a confianca operacional cai;
- manter o mesmo ritmo de crescimento passa a ser incoerente.

### Revisao de elegibilidade

Deve acontecer quando:

- o cliente pede nova oferta;
- o sistema detecta mudanca importante de risco;
- a conta transita para estado mais sensivel;
- a exposicao futura precisa ser recalibrada.

## Renegociacao e encaminhamento operacional

O monitoramento pos-credito deve abrir espaco para resposta operacional mais inteligente, sem tratar toda piora como caso igual.

### Quando considerar renegociacao

Como diretriz futura, a renegociacao pode fazer sentido quando:

- o cliente demonstra deterioracao real, mas nao necessariamente fraude;
- existe sinal de dificuldade crescente antes do atraso;
- a manutencao do fluxo original se torna improvavel;
- uma abordagem preventiva pode reduzir perda e preservar relacionamento.

### Quando priorizar encaminhamento operacional

O encaminhamento operacional deve ganhar prioridade quando:

- o risco sobe de forma consistente;
- os alertas preventivos se acumulam;
- a conta exige decisao humana;
- a situacao pede intervencao antes de dano maior.

### Principio de produto

O OpenCred nao deve operar apenas como aprovador de credito. Ele deve funcionar como gestor continuo de exposicao e confianca.

## Impacto operacional futuro

Esta diretriz sugere um modelo em que produto, risco e operacao trabalham sobre a mesma leitura:

- concessao inicial prudente;
- monitoramento continuo;
- alerta antes do problema;
- ajuste de limite conforme comportamento;
- renegociacao ou acao preventiva quando a conta piora.

## Resumo executivo

O monitoramento pos-credito futuro do OpenCred deve funcionar como a camada que acompanha o cliente depois da concessao e recalibra o relacionamento ao longo do tempo.

O modelo recomendado:

1. organiza o relacionamento em estados de risco pos-credito;
2. reavalia continuamente score, fraude e risco operacional;
3. gera alertas preventivos antes do atraso;
4. revisa limite, elegibilidade e exposicao conforme comportamento real;
5. prepara abordagem preventiva e possivel renegociacao quando o risco sobe.

Assim, o OpenCred deixa de ser apenas um sistema de aprovacao inicial e evolui para uma plataforma que acompanha risco de forma continua e responsavel.

## Implementacao MVP atual

O projeto agora possui um primeiro modulo funcional de monitoramento pos-credito em `lib/postCreditMonitoring`.

No estado atual:

- o sistema classifica o relacionamento em `low`, `moderate`, `high` ou `critical`;
- a avaliacao combina score financeiro, risco de fraude, nivel de confianca progressiva, historico de solicitacoes e padrao observado nas transacoes;
- o resultado devolve:
  - nivel de risco;
  - reasons;
  - alertas preventivos;
  - recomendacao operacional;
  - impacto em elegibilidade e limite futuro;
- o monitoramento registra metadados em auditoria durante a analise principal;
- o estado de monitoramento aparece na pagina de resultado e no detalhe do admin.

Este MVP ainda nao implementa cobranca, cron, atraso real ou renegociacao executavel, mas ja deixa a base pronta para evoluir com ciclos reais de pagamento e revisoes periodicas futuras.
