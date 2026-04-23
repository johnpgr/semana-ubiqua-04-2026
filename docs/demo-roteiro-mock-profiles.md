# Roteiro de Demo dos 5 Perfis Mockados

## Objetivo da demo

Esta demo existe para mostrar que o OpenCred nao trata todos os autonomos da mesma forma. A proposta e evidenciar, com exemplos claros, como perfis financeiros diferentes produzem scores, decisoes, limites sugeridos e reasons coerentes com o comportamento observado.

O foco da apresentacao nao e discutir implementacao interna em detalhe. O foco e mostrar que o produto:

- entende contexto financeiro alem de renda formal;
- diferencia qualidade de fluxo, estabilidade e historico;
- toma decisoes explicaveis;
- sugere limites de forma conservadora e coerente com o risco.

## Ordem sugerida de apresentacao

Para a demo ficar mais didatica, a ordem recomendada e:

1. `historico_insuficiente`
2. `fluxo_instavel`
3. `autonomo_irregular`
4. `motorista_consistente`
5. `perfil_forte`

Essa ordem ajuda a contar uma historia de evolucao de risco e qualidade:

- primeiro mostramos quem ainda nao tem base suficiente;
- depois quem tem fluxo problematico;
- depois quem tem renda real, mas irregular;
- em seguida um perfil consistente e confiavel;
- por fim o melhor caso, com historico forte e capacidade clara.

## Como conduzir a narrativa da demo

Ao apresentar cada caso, vale repetir a mesma estrutura:

1. mostrar o perfil selecionado no cadastro;
2. explicar em uma frase quem e esse usuario;
3. mostrar que as transacoes sinteticas combinam com esse contexto;
4. destacar score, decisao e valor aprovado ou sugerido;
5. fechar com os reasons, reforcando a explicabilidade.

Isso deixa a comparacao entre os cinco casos muito mais clara para banca, investidor ou avaliador tecnico.

---

## 1. `historico_insuficiente`

### Caracteristica principal

Usuario com pouca profundidade de historico. A renda pode ate parecer legitima, mas ainda nao existe base suficiente para confiar na concessao.

### Comportamento financeiro esperado

- janela curta de historico;
- poucas entradas registradas;
- poucas transacoes totais;
- sinais insuficientes para medir regularidade com seguranca.

### Faixa ou expectativa de score

Faixa esperada baixa, normalmente perto da parte inferior da escala. Como referencia de demo, esperar algo na faixa de `0-450`.

### Tipo de decisao esperado

`denied`

### Como apresentar esse perfil na demo

Comece por ele. Esse caso explica bem que o OpenCred nao aprova so porque existe alguma movimentacao. Mostre que o sistema evita superestimar um usuario quando o historico observado ainda e curto demais.

### Narrativa recomendada

"Aqui temos um usuario que ainda nao mostrou historico suficiente. O ponto nao e dizer que ele e ruim, e sim que ainda nao existe base observavel para liberar credito com seguranca."

---

## 2. `fluxo_instavel`

### Caracteristica principal

Usuario com fluxo desorganizado, volatilidade alta e saidas que pressionam muito a capacidade de pagamento.

### Comportamento financeiro esperado

- entradas irregulares;
- lacunas mais longas entre recebimentos;
- relacao entrada/saida apertada ou desfavoravel;
- grande oscilacao de valores;
- sinais de instabilidade no fluxo.

### Faixa ou expectativa de score

Faixa baixa a intermediaria baixa. Como referencia de demo, esperar algo em torno de `0-520`.

### Tipo de decisao esperado

`further_review`

### Como apresentar esse perfil na demo

Mostre que existe movimentacao real, mas que ela nao gera confianca automatica. Esse caso e bom para destacar que o produto nao olha so existencia de renda, e sim qualidade do fluxo.

### Narrativa recomendada

"Esse usuario movimenta dinheiro, mas de forma muito instavel. O OpenCred enxerga que existe atividade financeira, porem ainda sem previsibilidade suficiente para uma aprovacao automatica segura."

---

## 3. `autonomo_irregular`

### Caracteristica principal

Usuario autonomo real, com renda legitima, mas oscilante. E um caso importante porque representa bem o publico invisivel ao credito tradicional.

### Comportamento financeiro esperado

- entradas de servicos, freelance ou vendas avulsas;
- intervalos irregulares entre recebimentos;
- meses melhores e piores;
- capacidade presente, mas com menor estabilidade.

### Faixa ou expectativa de score

Faixa intermediaria. Como referencia de demo, esperar algo aproximadamente entre `450-780`.

### Tipo de decisao esperado

`approved_reduced`

### Como apresentar esse perfil na demo

Esse e o caso-chave para explicar a tese do produto. Mostre que o OpenCred nao rejeita automaticamente quem nao tem renda formal. Ao mesmo tempo, deixa claro que o limite e mais conservador por causa da irregularidade.

### Narrativa recomendada

"Aqui esta um autonomo de verdade: ele tem renda, trabalha e gira dinheiro, mas nao no formato perfeito que bancos tradicionais gostam. O OpenCred consegue reconhecer valor nesse perfil, mas com uma aprovacao mais conservadora."

---

## 4. `motorista_consistente`

### Caracteristica principal

Usuario de aplicativo com recorrencia boa de entradas e padrao relativamente previsivel.

### Comportamento financeiro esperado

- recebimentos frequentes;
- rotina de fluxo mais estavel;
- despesas coerentes com a atividade, como combustivel e manutencao;
- menor volatilidade relativa.

### Faixa ou expectativa de score

Faixa boa, normalmente acima da zona intermediaria. Como referencia de demo, esperar algo entre `700-900`.

### Tipo de decisao esperado

`approved`

### Como apresentar esse perfil na demo

Esse caso mostra inclusao com responsabilidade. O usuario nao precisa ter salario formal para demonstrar confiabilidade. O ideal e destacar a regularidade das entradas e como isso melhora score e decisao.

### Narrativa recomendada

"Esse perfil prova que consistencia importa. Mesmo sem contracheque tradicional, o comportamento financeiro repetido e observavel gera confianca suficiente para aprovacao."

---

## 5. `perfil_forte`

### Caracteristica principal

Melhor caso da demo. Usuario com historico profundo, renda alta e estavel e boa capacidade de pagamento.

### Comportamento financeiro esperado

- historico mais longo;
- entradas mais previsiveis;
- melhor sobra mensal;
- menor volatilidade;
- melhor equilibrio entre entradas e saidas.

### Faixa ou expectativa de score

Faixa alta. Como referencia de demo, esperar algo entre `800-1000`.

### Tipo de decisao esperado

`approved`

### Como apresentar esse perfil na demo

Deixe esse por ultimo. Ele fecha a apresentacao com o melhor exemplo de qualidade financeira, deixando clara a diferenca em relacao aos casos anteriores.

### Narrativa recomendada

"Esse e o perfil que combina historico, estabilidade e capacidade. O sistema reconhece isso com um score alto, aprovacao clara e um limite compatível com o comportamento observado."

---

## Comparacao rapida entre os 5 casos

| Perfil | Leitura principal | Score esperado | Decisao esperada |
| --- | --- | --- | --- |
| `historico_insuficiente` | pouca base observavel | `0-450` | `denied` |
| `fluxo_instavel` | fluxo ruim ou muito volatil | `0-520` | `further_review` |
| `autonomo_irregular` | renda real, mas oscilante | `450-780` | `approved_reduced` |
| `motorista_consistente` | recorrencia e padrao confiavel | `700-900` | `approved` |
| `perfil_forte` | historico forte e capacidade alta | `800-1000` | `approved` |

## Recomendacao de roteiro para mostrar evolucao de risco e qualidade

Uma forma forte de conduzir a demo e usar a seguinte linha:

1. "nao basta movimentar dinheiro";
2. "historico curto reduz confianca";
3. "instabilidade impede aprovacao automatica forte";
4. "renda irregular pode ser aprovada com conservadorismo";
5. "consistencia e historico sustentam limites melhores".

Assim, a banca enxerga que o OpenCred nao e apenas um aprovador ou negador simples. Ele organiza o risco em niveis compreensiveis.

## Como destacar score, decisao, valor e reasons

Em cada perfil, chame atencao sempre para os mesmos quatro pontos:

- **Score:** mostra a diferenca de qualidade entre os casos.
- **Decisao:** transforma score em acao pratica.
- **Valor aprovado ou sugerido:** mostra conservadorismo e responsabilidade.
- **Reasons:** provam explicabilidade e ajudam juridico, operacao e confianca do usuario.

## Conclusao

Esses cinco casos demonstram bem o valor do OpenCred porque cobrem todo o arco principal da analise: falta de historico, instabilidade, irregularidade com potencial, consistencia operacional e perfil financeiro forte. Juntos, eles mostram que o produto consegue ser inclusivo sem deixar de ser prudente, e que a decisao final vem acompanhada de uma explicacao clara e apresentavel.
