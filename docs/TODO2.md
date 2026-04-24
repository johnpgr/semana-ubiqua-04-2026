# TODO2 - Fluxo completo do usuário e ciclo de crédito

Este backlog organiza a próxima evolução do OpenCred para uma demo mais completa de ciclo de crédito. A ideia é manter o que já existe funcionando e adicionar, em etapas pequenas, uma jornada mais convincente:

`login -> área do usuário -> conexão bancária simulada -> solicitação -> consentimento -> análise -> resultado/oferta -> recebimento simulado -> empréstimo ativo -> pagamento simulado -> evolução de confiança/limite -> nova solicitação`

Nenhuma task abaixo deve quebrar os motores já implementados. O planejamento separa claramente UI, persistência/simulação, validação e o que fica fora de cada entrega.

## 1. Visão geral do fluxo novo

- [ ] Criar uma área do usuário como ponto de partida após login.
- [ ] Exibir se o perfil está completo e se existe conta bancária simulada conectada.
- [ ] Permitir iniciar ou retomar solicitação de crédito a partir dessa área.
- [ ] Tornar a conexão bancária simulada uma etapa visível antes ou durante o consentimento.
- [ ] Mostrar uma etapa de análise com progresso claro e linguagem compreensível.
- [ ] Transformar o resultado em oferta quando houver aprovação ou aprovação reduzida.
- [ ] Permitir recebimento de crédito simulado depois do aceite da oferta.
- [ ] Exibir empréstimo ativo com vencimento e ação de pagamento simulado.
- [ ] Mostrar que o pagamento melhora confiança, limite potencial e relacionamento.
- [ ] Permitir nova solicitação após o ciclo concluído.

## 2. Task A - Área do usuário

Planejar e implementar uma rota como `/minha-conta`, `/conta` ou equivalente, usada como hub depois do login.

### Escopo

- [ ] Exibir dados básicos do usuário: nome, CPF mascarado e perfil mockado.
- [ ] Exibir status do perfil: completo, pendente ou inconsistente.
- [ ] Exibir conta simulada: conectada ou não conectada.
- [ ] Exibir limite atual ou estimado com label de confiança.
- [ ] Exibir nível de confiança atual ou progresso simplificado.
- [ ] Exibir último resultado de análise, quando existir.
- [ ] Exibir empréstimo ativo, quando existir.
- [ ] Exibir histórico resumido das últimas solicitações.
- [ ] Incluir ações principais: conectar conta, solicitar crédito, ver resultado, pagar empréstimo, pedir novo crédito.

### Critérios de aceite

- [ ] A UI deve carregar para usuário autenticado com perfil criado.
- [ ] Usuário sem perfil deve continuar sendo direcionado para cadastro.
- [ ] A tela deve funcionar mesmo sem solicitações anteriores.
- [ ] O histórico deve mostrar estado vazio claro quando não houver dados.
- [ ] A task não deve alterar score, fraud score ou regras de decisão.

## 3. Task B - Conexão bancária simulada

Planejar uma experiência mockada de conexão bancária/Open Finance simulado.

### Escopo

- [ ] Criar card ou tela de conexão bancária simulada.
- [ ] Explicar quais dados serão usados: entradas, saídas, recorrência, estabilidade e sinais de risco.
- [ ] Incluir botão "Conectar conta simulada".
- [ ] Mostrar estado desconectado antes da ação.
- [ ] Mostrar estado conectado depois da ação.
- [ ] Integrar visualmente a conexão com consentimento e análise.
- [ ] Permitir entender que a conexão é simulada e segura para demo.

### Critérios de aceite

- [ ] A conexão deve ter estado visual persistido ou simulado de forma consistente.
- [ ] Usuário deve conseguir avançar para solicitação após conectar ou confirmar a conexão.
- [ ] O texto deve deixar claro que não há conexão bancária real.
- [ ] A task não deve integrar Open Finance real.
- [ ] A task não deve criar dependência de APIs externas.

## 4. Task C - Jornada de solicitação melhorada

Melhorar o fluxo de solicitação para explicar melhor o valor pedido e o comportamento conservador da primeira concessão.

### Escopo

- [ ] Manter campo de valor desejado.
- [ ] Exibir explicação curta sobre primeira concessão conservadora.
- [ ] Mostrar dependência de conta conectada ou consentimento pendente.
- [ ] Mostrar CTA claro para continuar análise.
- [ ] Orientar o usuário quando ainda faltar conexão simulada.
- [ ] Reaproveitar o fluxo atual de `credit_requests` sempre que possível.

### Critérios de aceite

- [ ] A solicitação deve continuar criando uma `credit_request`.
- [ ] O usuário deve entender por que o limite aprovado pode ser menor que o valor pedido.
- [ ] O fluxo deve indicar claramente o próximo passo.
- [ ] A task não deve mudar os pesos do score.
- [ ] A task não deve remover o consentimento.

## 5. Task D - Etapa visual de análise

Planejar uma tela ou estado intermediário para tornar a análise mais tangível na demo.

### Escopo

- [ ] Exibir passo "Coletando dados bancários simulados".
- [ ] Exibir passo "Calculando score financeiro".
- [ ] Exibir passo "Verificando sinais de fraude".
- [ ] Exibir passo "Aplicando crédito progressivo".
- [ ] Exibir passo "Gerando explicação da decisão".
- [ ] Direcionar automaticamente ou por CTA para o resultado quando a análise terminar.

### Critérios de aceite

- [ ] A etapa deve ser visual e compreensível para público não técnico.
- [ ] A análise deve refletir módulos já existentes sem expor detalhes sensíveis.
- [ ] Deve haver estado de erro recuperável caso a análise falhe.
- [ ] A task pode simular delay visual, mas não deve criar processamento assíncrono complexo.
- [ ] A task não deve duplicar cálculo de score no cliente.

## 6. Task E - Recebimento de crédito simulado

Planejar fluxo para aceitar oferta e receber crédito simulado após aprovação.

### Escopo

- [ ] Transformar resultado aprovado em oferta clara.
- [ ] Exibir valor aprovado, valor solicitado e condições simuladas.
- [ ] Incluir botão "Receber crédito simulado".
- [ ] Mostrar destino: conta bancária simulada conectada.
- [ ] Exibir estado de crédito liberado após aceite.
- [ ] Atualizar ou simular status para empréstimo ativo.

### Critérios de aceite

- [ ] Usuário aprovado deve conseguir aceitar a oferta.
- [ ] Usuário negado deve ver explicação e não deve ver botão de recebimento.
- [ ] Usuário em revisão deve ver estado de análise/revisão, não recebimento.
- [ ] A ação deve deixar claro que não há dinheiro real.
- [ ] A task não deve implementar pagamentos reais, Pix real ou contratos jurídicos reais.

## 7. Task F - Empréstimo ativo

Planejar visualização de empréstimo ativo após recebimento simulado.

### Escopo

- [ ] Exibir valor liberado.
- [ ] Exibir status do empréstimo: ativo, pago ou vencido simulado.
- [ ] Exibir vencimento simulado.
- [ ] Exibir ação para simular pagamento.
- [ ] Mostrar vínculo com monitoramento inicial de risco.
- [ ] Exibir empréstimo ativo também na área do usuário.

### Critérios de aceite

- [ ] Usuário com crédito liberado deve ver um empréstimo ativo.
- [ ] Usuário sem crédito liberado não deve ver empréstimo ativo falso.
- [ ] O vencimento pode ser calculado de forma simples para MVP.
- [ ] O monitoramento deve aparecer como leitura de risco, não como cobrança real.
- [ ] A task não deve criar cobrança real ou integração financeira.

## 8. Task G - Pagamento simulado

Planejar ação de pagamento simulado para fechar o primeiro ciclo.

### Escopo

- [ ] Incluir botão "Simular pagamento".
- [ ] Exibir confirmação antes de concluir, se necessário.
- [ ] Mostrar estado de pagamento concluído.
- [ ] Mostrar impacto visual positivo na confiança.
- [ ] Preparar CTA para nova solicitação.
- [ ] Registrar ou simular data de pagamento para histórico.

### Critérios de aceite

- [ ] Pagamento só deve aparecer para empréstimo ativo.
- [ ] Depois do pagamento, o empréstimo não deve continuar como ativo.
- [ ] A UI deve mostrar que o ciclo foi concluído.
- [ ] A melhoria de confiança deve ser explicada de forma simples.
- [ ] A task não deve processar boleto, cartão, Pix ou qualquer pagamento real.

## 9. Task H - Evolução de confiança e novo limite

Planejar como o pagamento simulado deve melhorar o relacionamento do usuário.

### Escopo

- [ ] Exibir nível anterior de confiança.
- [ ] Exibir novo nível, progresso ou badge após pagamento.
- [ ] Exibir novo limite potencial ou faixa estimada.
- [ ] Explicar o conceito de crédito progressivo.
- [ ] Conectar visualmente pagamento em dia com melhoria de limite.
- [ ] Manter linguagem conservadora: potencial, estimado ou sujeito a nova análise.

### Critérios de aceite

- [ ] Usuário deve entender por que o relacionamento melhorou.
- [ ] A UI não deve prometer aprovação automática futura.
- [ ] O limite potencial deve respeitar a lógica de crédito progressivo existente.
- [ ] A task não deve alterar a tese de risco sem revisão.
- [ ] A task não deve esconder fatores de fraude ou monitoramento quando relevantes.

## 10. Task I - Nova solicitação após pagamento

Planejar fluxo para pedir novo crédito depois de concluir o pagamento simulado.

### Escopo

- [ ] Incluir CTA "Pedir novo crédito" após pagamento concluído.
- [ ] Exibir mensagem de relacionamento melhorado.
- [ ] Pré-contextualizar que a nova solicitação considera histórico anterior.
- [ ] Integrar com crédito progressivo já existente.
- [ ] Permitir comparar solicitação anterior e nova oportunidade.

### Critérios de aceite

- [ ] CTA deve aparecer apenas quando o ciclo anterior permitir nova solicitação.
- [ ] Nova solicitação deve seguir consentimento/análise conforme necessário.
- [ ] Usuário deve perceber continuidade entre ciclos.
- [ ] A task não deve permitir múltiplas solicitações conflitantes sem estado claro.
- [ ] A task não deve ignorar risco de fraude ou monitoramento anterior.

## 11. Task J - Ajustes no admin, se viável

Planejar reflexos administrativos do ciclo completo sem transformar o admin em prioridade antes do fluxo do usuário.

### Escopo

- [ ] Mostrar crédito liberado simulado.
- [ ] Mostrar empréstimo ativo.
- [ ] Mostrar pagamento simulado.
- [ ] Mostrar ciclo concluído.
- [ ] Mostrar evolução de confiança.
- [ ] Permitir filtrar ou identificar solicitações por etapa do ciclo.

### Critérios de aceite

- [ ] Admin deve enxergar o estado do ciclo sem abrir várias telas.
- [ ] Detalhe da solicitação deve mostrar histórico relevante.
- [ ] Estados novos devem ser legíveis para operação e demo.
- [ ] A task deve ser adiada se ameaçar atrasar o fluxo principal do usuário.
- [ ] A task não deve substituir a área do usuário como foco da demo.

## 12. Ordem recomendada de implementação

Ordem sugerida pensando em menor risco, maior impacto visual e reutilização do que já existe:

- [ ] 1. Task A - Área do usuário como hub da jornada.
- [ ] 2. Task B - Conexão bancária simulada com estado simples.
- [ ] 3. Task C - Jornada de solicitação melhorada.
- [ ] 4. Task D - Etapa visual de análise.
- [ ] 5. Task E - Recebimento de crédito simulado.
- [ ] 6. Task F - Empréstimo ativo.
- [ ] 7. Task G - Pagamento simulado.
- [ ] 8. Task H - Evolução de confiança e novo limite.
- [ ] 9. Task I - Nova solicitação após pagamento.
- [ ] 10. Task J - Ajustes no admin, se houver tempo.

## 13. Critérios gerais de aceite

- [ ] O fluxo completo deve ser demonstrável com um usuário comum.
- [ ] A área do usuário deve deixar claro qual é o próximo passo.
- [ ] Estados vazios, pendentes, concluídos e de erro devem ter texto claro.
- [ ] Nenhuma etapa deve prometer crédito real, pagamento real ou conexão bancária real.
- [ ] O usuário deve entender a diferença entre valor solicitado, valor aprovado e limite potencial.
- [ ] O ciclo deve mostrar antes e depois: confiança, limite e histórico.
- [ ] Cada task deve ser validável manualmente no navegador.
- [ ] Testes automatizados podem ser planejados depois por fluxo, mas não fazem parte deste TODO2 inicial.
- [ ] Alterações de schema devem ser pequenas, explícitas e só feitas quando a task realmente precisar.
- [ ] Motores existentes devem ser reaproveitados antes de criar nova lógica.
- [ ] O admin deve vir depois do fluxo do usuário, salvo ajuste pequeno que ajude a demo.
