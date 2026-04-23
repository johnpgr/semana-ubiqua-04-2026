# Fraud Score e Antifraude Comportamental do OpenCred

## Visao geral

O OpenCred precisa separar de forma explicita dois eixos de avaliacao:

- **Credit Score**: mede capacidade financeira e qualidade do fluxo.
- **Fraud Score**: mede suspeita de manipulacao, identidade artificial, comportamento coordenado ou inflacao indevida de renda.

Essa separacao existe para evitar uma leitura incompleta do risco. Um usuario pode parecer financeiramente viavel e ainda assim apresentar sinais relevantes de fraude. Da mesma forma, um usuario com historico curto nao deve ser tratado como fraudador por padrao sem sinais comportamentais concretos.

Este documento registra diretrizes futuras de produto, risco e compliance para a evolucao do Fraud Score Engine. Nao define formula final nem altera o comportamento atual do codigo.

## Objetivo do Fraud Score

O Fraud Score deve funcionar como um motor de risco comportamental e operacional. Seu papel futuro e detectar sinais que nao pertencem ao eixo de capacidade financeira, como:

- multiplas contas com origem relacionada;
- padroes repetidos ou coordenados entre usuarios;
- movimentacao artificial criada para inflar score;
- uso tecnico suspeito de dispositivo, IP ou origem;
- comportamento inconsistente com uma jornada legitima.

Em resumo:

- o **Credit Score** responde "esse usuario parece capaz de pagar?";
- o **Fraud Score** responde "esse comportamento parece autentico e confiavel?".

## Contrato futuro do Fraud Score Engine

O contrato conceitual recomendado para o Fraud Score Engine deve ser legivel, operacional e desacoplado da implementacao final.

### Estrutura de saida recomendada

O resultado futuro deve incluir pelo menos:

- `value`: score numerico de fraude em faixa padronizada;
- `riskLevel`: classificacao de risco;
- `signals`: lista de sinais acionados;
- `reasons`: explicacoes legiveis por humanos;
- `operationalRecommendation`: recomendacao operacional;
- `breakdown`: agrupamento dos sinais por dimensao antifraude.

### Faixa sugerida

Como diretriz de produto, o Fraud Score pode seguir uma escala simples e comparavel, por exemplo:

- `0-1000`, onde valores maiores representam maior suspeita;

ou, alternativamente, uma escala interna diferente desde que o resultado final seja convertido para classificacao operacional clara.

O importante nao e fixar a escala agora, e sim garantir que:

- o resultado seja consistente;
- os sinais acionados sejam auditaveis;
- a leitura final seja facil para produto, risco, operacao e juridico.

### Classificacao esperada

O contrato deve sempre devolver uma classificacao interpretable, como:

- `baixo`
- `moderado`
- `alto`
- `critico`

### Campos principais do resultado futuro

Uma estrutura conceitual recomendada seria:

```txt
FraudScoreResult
- value
- riskLevel
- signals[]
- reasons[]
- operationalRecommendation
- breakdown
  - deviceTrust
  - patternRepetition
  - syntheticIncome
```

### Diferenca em relacao ao Credit Score

O Fraud Score nao mede:

- sobra mensal;
- regularidade de entradas;
- capacidade de pagamento;
- qualidade do historico financeiro no sentido tradicional.

Ele mede:

- confianca da origem;
- autenticidade do comportamento;
- semelhanca suspeita entre contas;
- sinais de manipulacao artificial.

## Sinais principais de antifraude

O planejamento futuro do antifraude deve se organizar em tres frentes.

## 1. Device Trust

### Objetivo

Medir a confianca tecnica da origem da conta e detectar reaproveitamento suspeito de dispositivo, IP ou contexto tecnico.

### Exemplos de sinais

- mesmo dispositivo associado a multiplas contas;
- mesmo IP aparecendo em clusters incomuns;
- criacao de varias contas em janela curta a partir da mesma origem;
- recorrencia tecnica incomum entre usuarios diferentes;
- divergencia entre comportamento esperado e assinatura tecnica observada.

### Uso esperado na analise futura

O Device Trust deve ajudar a responder:

- esta conta parece ter origem unica e legitima?
- existe indicio de reaproveitamento tecnico entre identidades diferentes?
- a conta nasceu de um contexto consistente ou potencialmente fabricado?

### Leitura operacional esperada

- risco baixo: origem tecnica coerente e sem correlacoes suspeitas relevantes;
- risco moderado: sinais pontuais que exigem observacao;
- risco alto ou critico: indicio forte de origem compartilhada, orquestrada ou reincidente.

## 2. Pattern Repetition

### Objetivo

Detectar comportamento excessivamente parecido entre usuarios diferentes, sugerindo operacao coordenada, replicacao artificial de jornada ou abuso de cadastro.

### Exemplos de sinais

- repeticao de horarios de cadastro ou solicitacao;
- mesma sequencia de acoes entre contas;
- perfis com movimentacao excessivamente parecida;
- grupos de usuarios com padrao anomalo de comportamento;
- semelhanca operacional muito acima do esperado para coincidencia normal.

### Uso esperado na analise futura

O Pattern Repetition deve ajudar a identificar:

- clusters suspeitos;
- contas operadas de forma coordenada;
- jornadas artificiais montadas para reproduzir comportamento "bom" em escala.

### Leitura operacional esperada

- risco baixo: sem semelhanca suspeita relevante;
- risco moderado: padroes repetidos pontuais;
- risco alto: cluster com forte semelhanca operacional;
- risco critico: repeticao estrutural e coordenada com potencial de fraude organizada.

## 3. Synthetic Income Detector

### Objetivo

Detectar manipulacao de fluxo financeiro para inflar artificialmente a leitura de renda, estabilidade ou capacidade.

### Exemplos de sinais

- entradas e saidas espelhadas;
- fluxo circular;
- retencao de saldo artificialmente baixa;
- picos anormais antes da solicitacao;
- aumento de movimentacao sem sustentacao posterior;
- uso de transacoes artificiais para parecer mais forte do que realmente e.

### Uso esperado na analise futura

O Synthetic Income Detector deve responder:

- esse fluxo parece organicamente gerado por atividade real?
- existe indicio de movimentacao montada apenas para melhorar score?
- o comportamento financeiro parece autentico ou ensaiado?

### Leitura operacional esperada

- risco baixo: fluxo coerente e sem artificios relevantes;
- risco moderado: alguns sinais incomuns, mas nao conclusivos;
- risco alto: forte suspeita de inflacao artificial;
- risco critico: padrao claramente orientado a fraude ou simulacao de capacidade.

## Classificacao de risco de fraude

O modelo futuro deve usar quatro niveis para tornar a decisao operacional clara.

### Baixo

**O que representa**

Pouca ou nenhuma evidencia de comportamento fraudulento relevante.

**Consequencia operacional futura**

- seguir fluxo normal;
- nao bloquear concessao por eixo de fraude;
- manter apenas monitoramento padrao.

### Moderado

**O que representa**

Existem sinais de atencao, mas ainda sem peso suficiente para bloqueio automatico.

**Consequencia operacional futura**

- exigir observacao adicional;
- reduzir automatismo da aprovacao;
- permitir revisao complementar quando combinado com outros sinais.

### Alto

**O que representa**

Ha suspeita relevante de comportamento nao autentico ou coordenado.

**Consequencia operacional futura**

- revisao manual reforcada;
- bloqueio preventivo de aumento de limite;
- possivel suspensao de aprovacao automatica.

### Critico

**O que representa**

Os sinais apontam fraude provavel ou forte manipulacao operacional.

**Consequencia operacional futura**

- negar concessao por suspeita relevante;
- interromper fluxo automatico;
- registrar trilha reforcada para risco e auditoria;
- encaminhar para acao operacional ou investigacao apropriada.

## Combinacao entre Credit Score e Fraud Score

O OpenCred deve tratar os dois motores como eixos separados e complementares.

### Principio central

Um bom Credit Score nao neutraliza um risco alto de fraude.

Da mesma forma, um Fraud Score baixo nao substitui a necessidade de boa capacidade financeira.

### Logica futura recomendada

A decisao final deve considerar:

- capacidade financeira;
- autenticidade e confianca do comportamento.

Uma diretriz simples e clara para produto seria:

- **Credit Score forte + Fraud Score baixo**: fluxo normal de aprovacao.
- **Credit Score forte + Fraud Score moderado**: aprovacao com observacao adicional ou revisao complementar.
- **Credit Score forte + Fraud Score alto/critico**: bloqueio, revisao manual obrigatoria ou negativa por suspeita.
- **Credit Score fraco + Fraud Score baixo**: decisao dominada pelo eixo financeiro, sem carimbar fraude.
- **Credit Score fraco + Fraud Score alto**: dupla penalizacao, com maior tendencia a negativa ou bloqueio.

### Leitura de produto

Isso evita tres erros comuns:

- aprovar porque o fluxo financeiro parecia bom, ignorando sinais de fraude;
- negar por fraude sem sinais comportamentais concretos;
- confundir risco de credito com risco de autenticidade.

## Consentimento e compliance para sinais sensiveis futuros

O Fraud Score futuro vai tocar sinais mais sensiveis do que o score financeiro atual. Por isso, o planejamento precisa separar claramente o que exige:

- consentimento explicito;
- politica especifica de uso;
- cautela juridica reforcada.

### Sinais que exigem cuidado especial

- dispositivo;
- IP e origem tecnica;
- padrao de uso;
- correlacao entre contas;
- sinais comportamentais derivados;
- indicadores externos sensiveis.

### Diretrizes recomendadas

#### 1. Dispositivo e origem tecnica

Precisam de linguagem clara de transparencia e base juridica adequada. O usuario deve saber que sinais de origem podem ser usados para seguranca, prevencao a fraude e protecao da plataforma.

#### 2. Padrao de uso e correlacao entre contas

Devem ser tratados com cautela, porque envolvem inferencia comportamental. O uso deve ser proporcional, rastreavel e explicado em politica e consentimento quando aplicavel.

#### 3. Indicadores externos sensiveis

Quando vierem de parceiros, precisam de contrato claro, limitacao de finalidade e revisao de compliance. Nem todo indicador deve ser tratado como dado livre de restricao.

### O que deve exigir consentimento explicito ou politica especifica

Como diretriz futura:

- fingerprint ou identificacao tecnica detalhada;
- sinais derivados de comportamento de uso;
- cruzamento de contas para deteccao de padrao;
- indicadores externos sensiveis ou enriquecidos.

### O que exige cautela juridica reforcada

- qualquer tratamento que envolva inferencia comportamental relevante;
- associacao indireta entre usuarios;
- uso de sinais tecnicos com potencial impacto em decisao automatizada;
- comunicacao de suspeita de fraude ao usuario sem base clara e revisavel.

## Roadmap futuro recomendado

### Fase 1 - Contrato e taxonomia

- definir contrato de resultado do Fraud Score;
- padronizar classificacao de risco;
- padronizar linguagem de sinais e reasons.

### Fase 2 - Coleta e governanca

- mapear sinais tecnicos e comportamentais;
- definir politicas de consentimento e compliance;
- definir trilha de auditoria para sinais antifraude.

### Fase 3 - Integracao decisoria

- combinar Credit Score e Fraud Score no fluxo final;
- definir quando revisar, bloquear ou negar;
- preparar leitura operacional para risco e juridico.

### Fase 4 - Expansao de sinais

- incorporar correlacao entre contas;
- incorporar indicadores externos;
- refinar detecao de fluxo artificial e clusterizacao suspeita.

## Resumo executivo

O Fraud Score futuro do OpenCred deve funcionar como a camada que responde se o comportamento observado parece autentico, seguro e confiavel. Ele nao substitui o Credit Score. Ele complementa o Credit Score.

O modelo recomendado:

1. separa risco financeiro de risco de fraude;
2. organiza os sinais em Device Trust, Pattern Repetition e Synthetic Income Detector;
3. classifica risco em baixo, moderado, alto e critico;
4. usa os dois motores juntos na decisao final;
5. trata sinais sensiveis com cuidado de consentimento e compliance.

Assim, o OpenCred evolui para um modelo de credito mais robusto, explicavel e resistente a abuso.
