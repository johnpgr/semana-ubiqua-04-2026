# Explicabilidade Juridica do OpenCred

## Visao geral

O OpenCred precisa comunicar decisoes de credito de forma clara, compreensivel e formalmente adequada. Essa necessidade vale para aprovacao, limite reduzido, revisao adicional e negativa.

Este documento registra diretrizes futuras de produto, compliance e experiencia do usuario para a camada de explicabilidade juridica. Ele nao altera a implementacao atual e nao define texto obrigatorio em codigo nesta etapa.

O objetivo principal e garantir que o usuario consiga entender:

- qual foi o resultado da analise;
- quais fatores principais influenciaram a decisao;
- se a decisao foi automatica ou passou por revisao adicional;
- quando dados futuros mais sensiveis exigirem transparencia e consentimento reforcados.

## Principios de explicabilidade

Como diretriz futura, a comunicacao de decisao do OpenCred deve seguir estes principios:

- **clareza**: usar linguagem simples, direta e nao tecnica;
- **proporcionalidade**: explicar o suficiente para dar transparencia sem expor logica interna excessiva;
- **consistencia**: manter coerencia entre score, risco, decisao e reason exibida;
- **formalidade adequada**: permitir uso em comunicacao oficial, inclusive email e trilha de auditoria;
- **nao exposicao excessiva**: evitar revelar detalhes internos que comprometam seguranca, antifraude ou facilitem manipulacao do sistema;
- **rastreabilidade**: permitir que a explicacao final seja coerente com os fatores registrados na analise.

## Catalogo futuro de reasons

O catalogo abaixo serve como base futura para textos de produto, email, tela de resultado e eventual trilha juridica. Os exemplos sao diretrizes de linguagem, nao mensagens finais obrigatorias.

## 1. Aprovacao

### Objetivo da mensagem

Comunicar que a solicitacao foi aprovada com base em sinais suficientes de confianca financeira, sem sugerir garantia de credito ilimitado ou permanencia automatica das mesmas condicoes.

### Exemplos de reasons adequadas

- Sua solicitacao foi aprovada com base no padrao financeiro observado ate aqui.
- Identificamos sinais suficientes de consistencia no seu historico para liberar esta concessao.
- Seu fluxo financeiro apresentou elementos favoraveis para esta aprovacao inicial.
- Sua analise indicou condicoes compativeis com a concessao deste credito.

### Diretriz de linguagem

- reforcar aprovacao sem prometer confianca maxima;
- evitar termos tecnicos como "threshold", "modelo" ou "peso de dimensao";
- manter a comunicacao compativel com futura evolucao de limite e reavaliacao.

## 2. Aprovacao com limite reduzido

### Objetivo da mensagem

Explicar que houve aprovacao, mas com cautela, porque o historico observado ainda nao justifica maior exposicao.

### Exemplos de reasons adequadas

- Sua solicitacao foi aprovada, mas com limite reduzido porque seu historico ainda esta em fase inicial de confianca.
- Liberamos uma primeira concessao em valor controlado, considerando o comportamento observado ate aqui.
- Seu perfil permitiu aprovacao, mas ainda exige cautela para uma exposicao maior.
- O limite aprovado foi reduzido porque seu historico atual ainda nao sustenta uma concessao mais alta.

### Diretriz de linguagem

- deixar claro que aprovacao inicial nao implica limite alto;
- conectar a reducao a cautela, historico curto, estabilidade parcial ou necessidade de observacao;
- evitar tom punitivo.

## 3. Revisao adicional

### Objetivo da mensagem

Informar que a solicitacao nao foi encerrada imediatamente e que exige analise complementar ou verificacao adicional.

### Exemplos de reasons adequadas

- Sua solicitacao precisa de analise complementar antes da decisao final.
- Identificamos fatores que exigem revisao adicional antes de concluir a analise.
- Sua analise segue em revisao porque precisamos confirmar melhor alguns elementos observados.
- Neste momento, sua solicitacao depende de verificacao adicional para seguirmos com seguranca.

### Diretriz de linguagem

- evitar afirmar fraude ou irregularidade sem base revisada;
- deixar claro que revisao adicional nao equivale automaticamente a negativa;
- indicar continuidade do processo quando for esse o caso.

## 4. Negativa

### Objetivo da mensagem

Comunicar a negativa com clareza, sem linguagem agressiva, preservando compreensao do usuario e coerencia com compliance.

### Exemplos de reasons adequadas

- Nao foi possivel aprovar sua solicitacao com base nos sinais financeiros observados ate agora.
- Seu historico atual ainda nao apresentou consistencia suficiente para esta concessao.
- Neste momento, os elementos analisados nao sustentam a liberacao do credito solicitado.
- Sua solicitacao nao foi aprovada porque o historico observado ainda exige maior cautela.

### Diretriz de linguagem

- explicar a negativa sem jargao;
- evitar expor regra interna detalhada;
- evitar frases categoricas sobre o usuario;
- manter espaco para evolucao futura do relacionamento, quando aplicavel.

## Fatores principais exibidos ao usuario

Nem todo fator interno deve ser mostrado com o mesmo nivel de detalhe. A recomendacao futura e exibir ao usuario apenas fatores principais, em formato resumido, legivel e acionavel.

## Fatores bons candidatos para exibicao

- consistencia de renda observada;
- estabilidade do fluxo financeiro;
- qualidade e profundidade do historico analisado;
- capacidade financeira observada para a solicitacao atual;
- necessidade de cautela na primeira concessao;
- necessidade de revisao adicional;
- atividade incomum ou risco relevante, em linguagem generica e segura.

## O que mostrar de forma resumida

Como diretriz futura, a tela ou comunicacao oficial deve priorizar:

- de 1 a 3 fatores principais por decisao;
- frases curtas e compreensiveis;
- foco em explicacao do resultado, e nao em detalhes tecnicos do motor.

Exemplos de formulacao resumida:

- Seu historico ainda e curto para uma concessao maior.
- Seu fluxo apresentou instabilidade no periodo analisado.
- Sua solicitacao exige revisao complementar.
- Identificamos sinais que pedem maior cautela nesta analise.

## O que nao deve ser exposto em excesso

Para equilibrar transparencia e seguranca, a documentacao futura do produto deve evitar exibir ao usuario:

- regras internas detalhadas de score;
- pesos, thresholds e formulas proprietarias;
- detalhes sensiveis do antifraude;
- correlacao entre contas ou sinais tecnicos especificos;
- classificacoes internas que possam facilitar engenharia reversa do sistema;
- linguagem que exponha investigacao interna sem revisao adequada.

## Decisao automatica versus revisao adicional

O OpenCred deve distinguir de forma clara quando uma decisao foi automatica e quando houve necessidade de revisao complementar.

## 1. Decisao automatica

### Quando comunicar

Quando o fluxo futuro encerrar a solicitacao com base nas regras automatizadas previstas, sem necessidade de intervencao adicional.

### Como comunicar

Exemplos de formulacao:

- Sua solicitacao foi analisada automaticamente com base nos dados autorizados.
- A decisao foi gerada a partir da analise automatica do seu historico e do contexto observado.

### Diretriz

- comunicar automacao com transparencia;
- deixar claro que a analise considerou dados autorizados;
- evitar transmitir falsa impressao de arbitrariedade.

## 2. Revisao adicional

### Quando comunicar

Quando a decisao depender de verificacao complementar, validacao operacional ou analise humana adicional.

### Como comunicar

Exemplos de formulacao:

- Sua solicitacao esta em analise complementar.
- Sua solicitacao exige revisao adicional antes da conclusao.
- Precisamos concluir uma verificacao extra antes de finalizar sua analise.

### Diretriz

- nao tratar revisao como negativa antecipada;
- manter linguagem neutra;
- indicar continuidade ou proximo estado esperado sempre que possivel.

## 3. Bloqueio preventivo por risco relevante

### Quando comunicar

Quando o fluxo futuro identificar risco relevante suficiente para interromper decisao automatica, bloquear progressao ou impedir concessao enquanto houver revisao.

### Como comunicar

Exemplos de formulacao:

- Sua solicitacao nao pode seguir automaticamente neste momento porque exige verificacao adicional de seguranca.
- Identificamos sinais que exigem uma avaliacao mais cuidadosa antes de prosseguir.

### Diretriz

- evitar acusacao direta de fraude ao usuario sem trilha apropriada;
- priorizar linguagem de seguranca, verificacao e cautela;
- reservar detalhes internos sensiveis para ambientes operacionais autorizados.

## Consentimento e dados sensiveis futuros

A explicabilidade juridica precisa acompanhar a evolucao futura do produto sempre que novos sinais sensiveis forem usados.

## Expansoes que exigem cuidado adicional

Como diretriz futura, merecem atencao reforcada:

- sinais comportamentais;
- dispositivo, IP e origem tecnica;
- correlacao entre contas;
- indicadores externos processados;
- outros sinais sensiveis com impacto em decisao automatizada.

## Relacao com consentimento e transparencia

Se esses sinais forem incorporados no futuro, a evolucao do produto deve garantir:

- explicacao clara sobre quais categorias de dado foram consideradas;
- separacao mais objetiva entre dados financeiros, comportamentais e externos;
- consentimento adequado quando aplicavel;
- documentacao coerente entre politica, consentimento e comunicacao da decisao.

## Diretrizes futuras de compliance

- novos dados sensiveis nao devem entrar silenciosamente no processo decisorio;
- a comunicacao ao usuario deve refletir a categoria de dado usada, sem abrir detalhes internos excessivos;
- explicacoes publicas devem permanecer compreensiveis mesmo quando a trilha interna for mais complexa;
- sinais de seguranca e antifraude devem ser tratados com linguagem prudente e revisavel;
- qualquer expansao com impacto juridico relevante deve ser acompanhada de revisao de consentimento e transparencia.

## Resumo executivo

Como diretriz futura, a explicabilidade juridica do OpenCred deve:

1. comunicar decisoes em linguagem simples e formalmente adequada;
2. manter um catalogo claro de reasons para aprovacao, reducao, revisao e negativa;
3. mostrar apenas os fatores principais que ajudam o usuario a entender a decisao;
4. distinguir decisao automatica de revisao adicional;
5. tratar dados sensiveis futuros com transparencia, consentimento e cautela de compliance.

Assim, o OpenCred fortalece confianca, experiencia do usuario e preparo juridico sem expor em excesso a logica interna do produto.

## Implementacao MVP atual

O projeto agora possui uma camada real de explicabilidade juridica em `lib/explainability`.

No MVP atual:

- a decisao final e transformada em mensagens mais claras para o usuario;
- existe um catalogo reutilizavel de reasons para aprovacao, limite reduzido, revisao adicional e negativa;
- a interface mostra fatores principais da decisao, em vez de apenas uma lista tecnica de motivos;
- o sistema distingue entre decisao automatica, revisao adicional e bloqueio preventivo;
- a explicabilidade aparece na pagina de resultado e no detalhe da solicitacao no admin;
- sinais mais sensiveis de seguranca permanecem resumidos de forma prudente, sem expor detalhes internos de antifraude;
- a base ja ficou preparada para evolucao futura com emails de explicabilidade, consentimentos expandidos e novas categorias de sinais.
