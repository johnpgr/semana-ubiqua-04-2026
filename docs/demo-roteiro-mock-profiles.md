# Roteiro de Demo dos 5 Perfis Mockados

## Objetivo da demo

Esta demo existe para mostrar que o OpenCred não trata todos os autônomos da mesma forma. A proposta é evidenciar, com exemplos claros, como perfis financeiros diferentes produzem scores, decisões, limites sugeridos e reasons coerentes com o comportamento observado.

O foco da apresentação não é discutir implementação interna em detalhe. O foco é mostrar que o produto:

- entende contexto financeiro além de renda formal;
- diferencia qualidade de fluxo, estabilidade e histórico;
- toma decisões explicáveis;
- sugere limites de forma conservadora e coerente com o risco.

## Ordem sugerida de apresentação

Para a demo ficar mais didática, a ordem recomendada é:

1. `historico_insuficiente`
2. `fluxo_instavel`
3. `autonomo_irregular`
4. `motorista_consistente`
5. `perfil_forte`

Essa ordem ajuda a contar uma história de evolução de risco e qualidade:

- primeiro mostramos quem ainda não tem base suficiente;
- depois quem tem fluxo problemático;
- depois quem tem renda real, mas irregular;
- em seguida um perfil consistente e confiável;
- por fim o melhor caso, com histórico forte e capacidade clara.

## Como conduzir a narrativa da demo

Ao apresentar cada caso, vale repetir a mesma estrutura:

1. mostrar o perfil selecionado no cadastro;
2. explicar em uma frase quem é esse usuário;
3. mostrar que as transações sintéticas combinam com esse contexto;
4. destacar score, decisão e valor aprovado ou sugerido;
5. fechar com os reasons, reforçando a explicabilidade.

Isso deixa a comparação entre os cinco casos muito mais clara para banca, investidor ou avaliador técnico.

---

## 1. `historico_insuficiente`

### Característica principal

Usuário com pouca profundidade de histórico. A renda pode até parecer legítima, mas ainda não existe base suficiente para confiar na concessão.

### Comportamento financeiro esperado

- janela curta de histórico;
- poucas entradas registradas;
- poucas transações totais;
- sinais insuficientes para medir regularidade com segurança.

### Faixa ou expectativa de score

Faixa esperada baixa, normalmente perto da parte inferior da escala. Como referência de demo, esperar algo na faixa de `0-450`.

### Tipo de decisão esperado

`denied`

### Como apresentar esse perfil na demo

Comece por ele. Esse caso explica bem que o OpenCred não aprova só porque existe alguma movimentação. Mostre que o sistema evita superestimar um usuário quando o histórico observado ainda é curto demais.

### Narrativa recomendada

"Aqui temos um usuário que ainda não mostrou histórico suficiente. O ponto não é dizer que ele é ruim, e sim que ainda não existe base observável para liberar crédito com segurança."

---

## 2. `fluxo_instavel`

### Característica principal

Usuário com fluxo desorganizado, volatilidade alta e saídas que pressionam muito a capacidade de pagamento.

### Comportamento financeiro esperado

- entradas irregulares;
- lacunas mais longas entre recebimentos;
- relação entrada/saída apertada ou desfavorável;
- grande oscilação de valores;
- sinais de instabilidade no fluxo.

### Faixa ou expectativa de score

Faixa baixa a intermediária baixa. Como referência de demo, esperar algo em torno de `0-520`.

### Tipo de decisão esperado

`further_review`

### Como apresentar esse perfil na demo

Mostre que existe movimentação real, mas que ela não gera confiança automática. Esse caso é bom para destacar que o produto não olha só existência de renda, e sim qualidade do fluxo.

### Narrativa recomendada

"Esse usuário movimenta dinheiro, mas de forma muito instável. O OpenCred enxerga que existe atividade financeira, porém ainda sem previsibilidade suficiente para uma aprovação automática segura."

---

## 3. `autonomo_irregular`

### Característica principal

Usuário autônomo real, com renda legítima, mas oscilante. É um caso importante porque representa bem o público invisível ao crédito tradicional.

### Comportamento financeiro esperado

- entradas de serviços, freelance ou vendas avulsas;
- intervalos irregulares entre recebimentos;
- meses melhores e piores;
- capacidade presente, mas com menor estabilidade.

### Faixa ou expectativa de score

Faixa intermediária. Como referência de demo, esperar algo aproximadamente entre `450-780`.

### Tipo de decisão esperado

`approved_reduced`

### Como apresentar esse perfil na demo

Esse é o caso-chave para explicar a tese do produto. Mostre que o OpenCred não rejeita automaticamente quem não tem renda formal. Ao mesmo tempo, deixa claro que o limite é mais conservador por causa da irregularidade.

### Narrativa recomendada

"Aqui está um autônomo de verdade: ele tem renda, trabalha e gira dinheiro, mas não no formato perfeito que bancos tradicionais gostam. O OpenCred consegue reconhecer valor nesse perfil, mas com uma aprovação mais conservadora."

---

## 4. `motorista_consistente`

### Característica principal

Usuário de aplicativo com recorrência boa de entradas e padrão relativamente previsível.

### Comportamento financeiro esperado

- recebimentos frequentes;
- rotina de fluxo mais estável;
- despesas coerentes com a atividade, como combustível e manutenção;
- menor volatilidade relativa.

### Faixa ou expectativa de score

Faixa boa, normalmente acima da zona intermediária. Como referência de demo, esperar algo entre `700-900`.

### Tipo de decisão esperado

`approved`

### Como apresentar esse perfil na demo

Esse caso mostra inclusão com responsabilidade. O usuário não precisa ter salário formal para demonstrar confiabilidade. O ideal é destacar a regularidade das entradas e como isso melhora score e decisão.

### Narrativa recomendada

"Esse perfil prova que consistência importa. Mesmo sem contracheque tradicional, o comportamento financeiro repetido e observável gera confiança suficiente para aprovação."

---

## 5. `perfil_forte`

### Característica principal

Melhor caso da demo. Usuário com histórico profundo, renda alta e estável e boa capacidade de pagamento.

### Comportamento financeiro esperado

- histórico mais longo;
- entradas mais previsíveis;
- melhor sobra mensal;
- menor volatilidade;
- melhor equilíbrio entre entradas e saídas.

### Faixa ou expectativa de score

Faixa alta. Como referência de demo, esperar algo entre `800-1000`.

### Tipo de decisão esperado

`approved`

### Como apresentar esse perfil na demo

Deixe esse por último. Ele fecha a apresentação com o melhor exemplo de qualidade financeira, deixando clara a diferença em relação aos casos anteriores.

### Narrativa recomendada

"Esse é o perfil que combina histórico, estabilidade e capacidade. O sistema reconhece isso com um score alto, aprovação clara e um limite compatível com o comportamento observado."

---

## Comparação rápida entre os 5 casos

| Perfil | Leitura principal | Score esperado | Decisão esperada |
| --- | --- | --- | --- |
| `historico_insuficiente` | pouca base observável | `0-450` | `denied` |
| `fluxo_instavel` | fluxo ruim ou muito volátil | `0-520` | `further_review` |
| `autonomo_irregular` | renda real, mas oscilante | `450-780` | `approved_reduced` |
| `motorista_consistente` | recorrência e padrão confiável | `700-900` | `approved` |
| `perfil_forte` | histórico forte e capacidade alta | `800-1000` | `approved` |

## Recomendação de roteiro para mostrar evolução de risco e qualidade

Uma forma forte de conduzir a demo é usar a seguinte linha:

1. "não basta movimentar dinheiro";
2. "histórico curto reduz confiança";
3. "instabilidade impede aprovação automática forte";
4. "renda irregular pode ser aprovada com conservadorismo";
5. "consistência e histórico sustentam limites melhores".

Assim, a banca enxerga que o OpenCred não é apenas um aprovador ou negador simples. Ele organiza o risco em níveis compreensíveis.

## Como destacar score, decisão, valor e reasons

Em cada perfil, chame atenção sempre para os mesmos quatro pontos:

- **Score:** mostra a diferença de qualidade entre os casos.
- **Decisão:** transforma score em ação prática.
- **Valor aprovado ou sugerido:** mostra conservadorismo e responsabilidade.
- **Reasons:** provam explicabilidade e ajudam jurídico, operação e confiança do usuário.

## Conclusão

Esses cinco casos demonstram bem o valor do OpenCred porque cobrem todo o arco principal da análise: falta de histórico, instabilidade, irregularidade com potencial, consistência operacional e perfil financeiro forte. Juntos, eles mostram que o produto consegue ser inclusivo sem deixar de ser prudente, e que a decisão final vem acompanhada de uma explicação clara e apresentável.
