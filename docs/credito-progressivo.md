# Credito Progressivo do OpenCred

## Visao geral

O OpenCred deve evoluir de uma aprovacao inicial baseada em score para um modelo de confianca progressiva. A ideia central e simples: a primeira concessao precisa ser controlada, e o aumento de limite deve acontecer apenas quando o comportamento observado depois da concessao confirmar a confianca inicial.

Esta diretriz existe para equilibrar inclusao e prudencia:

- incluir autonomos que nao se encaixam bem em modelos tradicionais;
- evitar superexposicao logo na primeira oferta;
- transformar comportamento observado em confianca acumulada;
- permitir aumento de limite com base em evidencias, e nao apenas em expectativa.

Este documento define diretrizes de produto para as proximas evolucoes. Nao fixa formula matematica final nem altera o comportamento atual do codigo. O objetivo e registrar como o credito progressivo deve funcionar futuramente.

## Principios do modelo

- Aprovacao inicial nao implica limite alto.
- Historico curto exige cautela, mesmo quando o score inicial permite aprovacao.
- Limite e confianca devem crescer por etapas.
- Evolucao depende de observacao continua, nao apenas da analise inicial.
- Comportamento positivo sustentado deve destravar melhores ofertas.
- Comportamento negativo ou inconsistente deve congelar, reduzir ou impedir a evolucao.

## Modelo de niveis de limite progressivo

O modelo recomendado e organizado em quatro niveis de confianca.

### Nivel 1 - Entrada

**Objetivo do nivel**

Permitir a primeira concessao de forma controlada, validando se o comportamento real do cliente confirma a leitura inicial do score.

**Perfil de risco esperado**

- risco ainda moderado ou parcialmente conhecido;
- historico financeiro inicial suficiente para uma primeira decisao;
- pouca ou nenhuma observacao de comportamento pos-concessao.

**Comportamento de limite esperado**

- limite inicial pequeno;
- exposicao controlada;
- margem de seguranca maior do que nos niveis superiores.

**Tipo de concessao compativel**

- aprovacao com valor reduzido;
- aprovacao inicial prudente;
- eventual negacao quando o historico for curto ou insuficiente demais.

### Nivel 2 - Confianca inicial

**Objetivo do nivel**

Reconhecer clientes que ja completaram os primeiros ciclos sem deterioracao relevante do risco.

**Perfil de risco esperado**

- risco em queda ou estavel;
- sinais iniciais de organizacao financeira;
- primeiros pagamentos dentro do esperado.

**Comportamento de limite esperado**

- pequenos aumentos de limite;
- ampliacao gradual, sem salto agressivo;
- manutencao de postura conservadora.

**Tipo de concessao compativel**

- nova oferta com aumento moderado;
- manutencao do limite atual quando ainda nao houver confianca suficiente para subir mais.

### Nivel 3 - Cliente confiavel

**Objetivo do nivel**

Dar mais espaco para crescimento quando o cliente ja demonstrou consistencia em multiplos ciclos.

**Perfil de risco esperado**

- comportamento estavel ao longo do tempo;
- capacidade de pagamento confirmada na pratica;
- menor necessidade de cautela extrema.

**Comportamento de limite esperado**

- aumentos progressivos mais relevantes;
- melhor equilibrio entre inclusao e rentabilidade;
- concessoes mais alinhadas a capacidade observada.

**Tipo de concessao compativel**

- aprovacoes mais robustas;
- revisao positiva de limite com base em historico sustentado.

### Nivel 4 - Cliente premium

**Objetivo do nivel**

Representar o cliente com historico longo e confianca consolidada.

**Perfil de risco esperado**

- risco baixo e controlado;
- bom historico de pagamento;
- estabilidade financeira e operacional sustentada.

**Comportamento de limite esperado**

- acesso a limites mais altos;
- condicoes mais favoraveis dentro da politica de risco;
- crescimento menos travado, embora ainda dependente de monitoramento.

**Tipo de concessao compativel**

- revisoes positivas mais amplas;
- continuidade de relacionamento com menor friccao.

## Criterios para evolucao de limite

O OpenCred nao precisa definir agora uma formula fechada, mas precisa deixar a logica de negocio clara. A progressao recomendada deve considerar um conjunto de sinais, e nao um unico gatilho isolado.

### 1. Pagamentos em dia

Este deve ser um dos sinais mais importantes de evolucao.

Diretriz:

- pagamento em dia fortalece confianca;
- atraso reduz ritmo de progressao;
- inadimplencia ou comportamento de risco relevante deve bloquear aumento.

### 2. Quantidade de ciclos concluidos

Confianca progressiva exige recorrencia observada.

Diretriz:

- um unico ciclo positivo ajuda, mas nao deve sustentar grande aumento;
- multiplos ciclos bem concluidos justificam ampliacao gradual;
- historico mais longo reduz dependencia da leitura inicial.

### 3. Estabilidade de renda e fluxo

Nao basta pagar uma vez. O padrao de renda precisa continuar coerente.

Diretriz:

- manutencao de entradas recorrentes favorece evolucao;
- piora material na estabilidade reduz confianca;
- volatilidade excessiva deve tornar o aumento mais lento ou impedir subida.

### 4. Consistencia financeira ao longo do tempo

O sistema deve observar se o cliente mantem organizacao financeira apos receber credito.

Diretriz:

- boa relacao entre entradas e saidas ajuda progressao;
- preservacao de capacidade de pagamento aumenta elegibilidade para nova oferta;
- deterioracao persistente deve interromper crescimento.

### 5. Reducao de sinais de risco

Mesmo sem entrar aqui em antifraude detalhado, o modelo de credito progressivo deve considerar se o risco permanece controlado.

Diretriz:

- ausencia de sinais suspeitos ajuda a destravar novos niveis;
- comportamento incoerente, anomalias ou revisoes negativas devem impedir aumento;
- risco elevado invalida crescimento, mesmo com score inicial razoavel.

## Impacto dos ciclos de pagamento futuros

O credito progressivo depende de observacao continua. A analise inicial abre a porta, mas a confianca e recalibrada a cada ciclo relevante.

### Quando o comportamento e positivo

Se o cliente:

- paga em dia;
- mantem renda e fluxo coerentes;
- nao apresenta deterioracao relevante;
- sustenta comportamento estavel por mais de um ciclo,

entao o sistema deve considerar:

- aumento gradual de confianca;
- elegibilidade para revisao positiva de limite;
- maior probabilidade de nova oferta;
- migracao para um nivel superior de relacionamento.

### Quando o comportamento e neutro

Se o cliente:

- paga corretamente;
- mas ainda sem historico suficiente;
- ou sem ganho claro de estabilidade,

entao o sistema deve considerar:

- manutencao do nivel atual;
- pouca ou nenhuma evolucao de limite;
- nova observacao antes de ampliar exposicao.

### Quando o comportamento e negativo

Se o cliente:

- atrasa pagamento;
- piora o fluxo financeiro;
- aumenta sinais de risco;
- ou perde consistencia relevante,

entao o sistema deve considerar:

- bloqueio de aumento;
- manutencao conservadora do limite;
- reducao de expectativa de nova oferta;
- revisao mais dura de confianca e elegibilidade.

## Como o score inicial conservador deve impactar a primeira concessao

O score inicial continua importante, mas nao deve ser interpretado como permissao para liberar exposicao alta logo no primeiro contato.

### Diretriz principal

O primeiro score deve servir para responder:

- existe base minima para uma primeira concessao?
- qual o grau de cautela necessario nessa entrada?

Ele nao deve ser usado para assumir confianca maxima.

### Implicacoes praticas para a primeira concessao

- aprovacao inicial deve ser controlada;
- limites iniciais devem ser menores do que o potencial maximo teorico do cliente;
- historico curto ou inicial exige margem maior de seguranca;
- clientes com bom score, mas sem comportamento pos-concessao observado, ainda devem entrar em niveis mais cautelosos.

### Leitura de produto

Em outras palavras:

- "aprovado" nao significa "cliente totalmente conhecido";
- "bom score inicial" nao significa "limite alto imediato";
- "historico promissor" nao substitui comportamento confirmado.

## Regras de negocio futuras recomendadas

Estas regras servem como diretriz para futuras implementacoes:

- A primeira concessao deve ser menor que a capacidade maxima potencial estimada.
- Evolucao de limite deve exigir historico observado depois da primeira concessao.
- Aumento relevante de limite deve depender de mais de um ciclo positivo.
- Historico curto, mesmo com score bom, deve permanecer em niveis iniciais.
- Queda de comportamento deve congelar ou reverter a evolucao.
- Confianca acumulada deve refletir pagamento, estabilidade e consistencia observada.

## Implicacoes futuras para score e limite

Este modelo sugere uma separacao conceitual importante:

- o **score inicial** apoia a decisao de entrada;
- a **confianca acumulada** apoia a progressao de limite.

Na pratica, isso significa que o OpenCred deve evoluir para combinar:

- score financeiro inicial;
- observacao continua de comportamento;
- historico de pagamento;
- revisao periodica de elegibilidade.

O limite futuro nao deve depender apenas do score original. Ele deve refletir o relacionamento observado com o cliente ao longo do tempo.

## Resumo executivo

O modelo de credito progressivo do OpenCred deve funcionar como uma trilha de confianca:

1. entrada conservadora;
2. observacao de comportamento;
3. aumento gradual para quem confirma boa capacidade e disciplina;
4. bloqueio ou desaceleracao para quem piora o risco.

Assim, o produto reforca sua proposta de valor: ser inclusivo na entrada, mas disciplinado na evolucao do limite.

## Implementacao MVP atual

O sistema agora possui uma implementacao inicial e demonstravel de credito progressivo.

Nesta versao MVP:

- a regra foi centralizada em `lib/creditProgression`;
- a Server Action de analise aplica a politica progressiva depois do score financeiro;
- a primeira concessao recebe teto conservador de entrada, mesmo quando o score base e forte;
- o nivel de confianca atual passa a ser calculado com base em historico de solicitacoes aprovadas e estrutura pronta para futuros ciclos pagos em dia;
- o resultado final persistido em `scores` e `credit_requests` ja reflete o ajuste progressivo de limite e decisao;
- a UI de resultado e o detalhe do admin exibem nivel de confianca, contexto de concessao inicial conservadora e teto da etapa atual.

Essa base nao implementa cobranca real nem evolucao por pagamento efetivo ainda, mas deixa o ponto de extensao concreto para adicionar sinais futuros de ciclos, atraso e confianca acumulada.

## Reavaliacao continua

A reavaliacao continua e o ponto em que o credito progressivo deixa de depender apenas da primeira analise e passa a acompanhar o relacionamento.

**Gatilhos futuros de reavaliacao:**

- nova solicitacao do mesmo usuario (ja acontece hoje, via `requestHistory` passado para a politica);
- fim de ciclo de pagamento (quando existir cobranca real);
- janela de inatividade significativa (por exemplo, mais de 90 dias sem novo sinal);
- evento de risco externo (parceiro, monitoramento ou fraude).

**O que muda em uma reavaliacao vs. primeira concessao:**

- o peso relativo de `behavior` no motor financeiro deve aumentar quando ja existe historico observado pos-concessao;
- o peso de `dataQuality` deve cair na mesma medida, porque ja nao e a maior incerteza;
- a politica progressiva deve deixar de aplicar o teto conservador de "primeira concessao" quando o usuario acumulou ciclos completos com bom desempenho;
- a decisao deve permitir elevacao de limite ate o nivel seguinte de confianca, respeitando o teto da faixa.

**Estados operacionais que impedem progressao automatica:**

- monitoramento pos-credito em `high` ou `critical`;
- Fraud Score em `moderate` ou pior;
- elegibilidade em `frozen`, `review_required` ou `blocked`.

Esses estados sao descritos em `docs/monitoramento-pos-credito.md` e ja sao consumidos pelo MVP atual como bloqueadores. Em reavaliacoes futuras, eles devem permanecer como travas explicitas antes de qualquer elevacao.
