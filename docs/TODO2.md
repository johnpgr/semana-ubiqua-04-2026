# TODO2 - Fluxo completo do usuário e ciclo de crédito

Este backlog organiza a próxima evolução do OpenCred para uma demo mais completa de ciclo de crédito. A ideia é manter o que já existe funcionando e adicionar, em etapas pequenas, uma jornada mais convincente:

`login -> área do usuário -> conexão bancária simulada -> solicitação -> consentimento -> análise -> resultado/oferta -> recebimento simulado -> empréstimo ativo -> pagamento simulado -> evolução de confiança/limite -> nova solicitação`

Nenhuma task abaixo deve quebrar os motores já implementados. O planejamento separa claramente UI, persistência/simulação, validação e o que fica fora de cada entrega.

## 1. Visão geral do fluxo novo

- [x] Criar uma área do usuário como ponto de partida após login.
- [x] Exibir se o perfil está completo e se existe conta bancária simulada conectada.
- [x] Permitir iniciar ou retomar solicitação de crédito a partir dessa área.
- [x] Tornar a conexão bancária simulada uma etapa visível antes ou durante o consentimento.
- [x] Mostrar uma etapa de análise com progresso claro e linguagem compreensível.
- [x] Transformar o resultado em oferta quando houver aprovação ou aprovação reduzida.
- [x] Permitir recebimento de crédito simulado depois do aceite da oferta.
- [x] Exibir empréstimo ativo com vencimento e ação de pagamento simulado.
- [x] Mostrar que o pagamento melhora confiança, limite potencial e relacionamento.
- [x] Permitir nova solicitação após o ciclo concluído.

## 2. Task A - Área do usuário

Planejar e implementar uma rota como `/minha-conta`, `/conta` ou equivalente, usada como hub depois do login.

### Escopo

- [x] Exibir dados básicos do usuário: nome, CPF mascarado e perfil mockado.
- [x] Exibir status do perfil: completo, pendente ou inconsistente.
- [x] Exibir conta simulada: conectada ou não conectada.
- [x] Exibir limite atual ou estimado com label de confiança.
- [x] Exibir nível de confiança atual ou progresso simplificado.
- [x] Exibir último resultado de análise, quando existir.
- [x] Exibir empréstimo ativo, quando existir.
- [x] Exibir histórico resumido das últimas solicitações.
- [x] Incluir ações principais: conectar conta, solicitar crédito, ver resultado, pagar empréstimo, pedir novo crédito.

### Critérios de aceite

- [x] A UI deve carregar para usuário autenticado com perfil criado.
- [x] Usuário sem perfil deve continuar sendo direcionado para cadastro.
- [x] A tela deve funcionar mesmo sem solicitações anteriores.
- [x] O histórico deve mostrar estado vazio claro quando não houver dados.
- [x] A task não deve alterar score, fraud score ou regras de decisão.

## 3. Task B - Conexão bancária simulada

Planejar uma experiência mockada de conexão bancária/Open Finance simulado.

### Escopo

- [x] Criar card ou tela de conexão bancária simulada.
- [x] Explicar quais dados serão usados: entradas, saídas, recorrência, estabilidade e sinais de risco.
- [x] Incluir botão "Conectar conta simulada".
- [x] Mostrar estado desconectado antes da ação.
- [x] Mostrar estado conectado depois da ação.
- [x] Integrar visualmente a conexão com consentimento e análise.
- [x] Permitir entender que a conexão é simulada e segura para demo.

### Critérios de aceite

- [x] A conexão deve ter estado visual persistido ou simulado de forma consistente.
- [x] Usuário deve conseguir avançar para solicitação após conectar ou confirmar a conexão.
- [x] O texto deve deixar claro que não há conexão bancária real.
- [x] A task não deve integrar Open Finance real.
- [x] A task não deve criar dependência de APIs externas.

## 4. Task C - Jornada de solicitação melhorada

Melhorar o fluxo de solicitação para explicar melhor o valor pedido e o comportamento conservador da primeira concessão.

### Escopo

- [x] Manter campo de valor desejado.
- [x] Exibir explicação curta sobre primeira concessão conservadora.
- [x] Mostrar dependência de conta conectada ou consentimento pendente.
- [x] Mostrar CTA claro para continuar análise.
- [x] Orientar o usuário quando ainda faltar conexão simulada.
- [x] Reaproveitar o fluxo atual de `credit_requests` sempre que possível.

### Critérios de aceite

- [x] A solicitação deve continuar criando uma `credit_request`.
- [x] O usuário deve entender por que o limite aprovado pode ser menor que o valor pedido.
- [x] O fluxo deve indicar claramente o próximo passo.
- [x] A task não deve mudar os pesos do score.
- [x] A task não deve remover o consentimento.

## 5. Task D - Etapa visual de análise

Planejar uma tela ou estado intermediário para tornar a análise mais tangível na demo.

### Escopo

- [x] Exibir passo "Coletando dados bancários simulados".
- [x] Exibir passo "Calculando score financeiro".
- [x] Exibir passo "Verificando sinais de fraude".
- [x] Exibir passo "Aplicando crédito progressivo".
- [x] Exibir passo "Consultando indicadores externos de parceiros".
- [x] Exibir passo "Gerando explicação da decisão".
- [x] Exibir passo "Preparando comunicação oficial".
- [x] Direcionar automaticamente ou por CTA para o resultado quando a análise terminar.

### Critérios de aceite

- [x] A etapa deve ser visual e compreensível para público não técnico.
- [x] A análise deve refletir módulos já existentes sem expor detalhes sensíveis.
- [x] Deve haver estado de erro recuperável caso a análise falhe.
- [x] A task pode simular delay visual, mas não deve criar processamento assíncrono complexo.
- [x] A task não deve duplicar cálculo de score no cliente.

## 6. Task E - Recebimento de crédito simulado

Planejar fluxo para aceitar oferta e receber crédito simulado após aprovação.

### Escopo

- [x] Transformar resultado aprovado em oferta clara.
- [x] Exibir valor aprovado, valor solicitado e condições simuladas.
- [x] Incluir botão "Receber crédito simulado".
- [x] Mostrar destino: conta bancária simulada conectada.
- [x] Exibir estado de crédito liberado após aceite.
- [x] Atualizar ou simular status para empréstimo ativo.

### Critérios de aceite

- [x] Usuário aprovado deve conseguir aceitar a oferta.
- [x] Usuário negado deve ver explicação e não deve ver botão de recebimento.
- [x] Usuário em revisão deve ver estado de análise/revisão, não recebimento.
- [x] A ação deve deixar claro que não há dinheiro real.
- [x] A task não deve implementar pagamentos reais, Pix real ou contratos jurídicos reais.

## 7. Task F - Empréstimo ativo

Planejar visualização de empréstimo ativo após recebimento simulado.

### Escopo

- [x] Exibir valor liberado.
- [x] Exibir status do empréstimo: ativo, pago ou vencido simulado.
- [x] Exibir vencimento simulado.
- [x] Exibir ação para simular pagamento.
- [x] Mostrar vínculo com monitoramento inicial de risco.
- [x] Exibir empréstimo ativo também na área do usuário.

### Critérios de aceite

- [x] Usuário com crédito liberado deve ver um empréstimo ativo.
- [x] Usuário sem crédito liberado não deve ver empréstimo ativo falso.
- [x] O vencimento pode ser calculado de forma simples para MVP.
- [x] O monitoramento deve aparecer como leitura de risco, não como cobrança real.
- [x] A task não deve criar cobrança real ou integração financeira.

## 8. Task G - Pagamento simulado

Planejar ação de pagamento simulado para fechar o primeiro ciclo.

### Escopo

- [x] Incluir botão "Simular pagamento".
- [x] Exibir confirmação antes de concluir, se necessário.
- [x] Mostrar estado de pagamento concluído.
- [x] Mostrar impacto visual positivo na confiança.
- [x] Preparar CTA para nova solicitação.
- [x] Registrar ou simular data de pagamento para histórico.

### Critérios de aceite

- [x] Pagamento só deve aparecer para empréstimo ativo.
- [x] Depois do pagamento, o empréstimo não deve continuar como ativo.
- [x] A UI deve mostrar que o ciclo foi concluído.
- [x] A melhoria de confiança deve ser explicada de forma simples.
- [x] A task não deve processar boleto, cartão, Pix ou qualquer pagamento real.

## 9. Task H - Evolução de confiança e novo limite

Planejar como o pagamento simulado deve melhorar o relacionamento do usuário.

### Escopo

- [x] Exibir nível anterior de confiança.
- [x] Exibir novo nível, progresso ou badge após pagamento.
- [x] Exibir novo limite potencial ou faixa estimada.
- [x] Explicar o conceito de crédito progressivo.
- [x] Conectar visualmente pagamento em dia com melhoria de limite.
- [x] Manter linguagem conservadora: potencial, estimado ou sujeito a nova análise.

### Critérios de aceite

- [x] Usuário deve entender por que o relacionamento melhorou.
- [x] A UI não deve prometer aprovação automática futura.
- [x] O limite potencial deve respeitar a lógica de crédito progressivo existente.
- [x] A task não deve alterar a tese de risco sem revisão.
- [x] A task não deve esconder fatores de fraude ou monitoramento quando relevantes.

## 10. Task I - Nova solicitação após pagamento

Planejar fluxo para pedir novo crédito depois de concluir o pagamento simulado.

### Escopo

- [x] Incluir CTA "Pedir novo crédito" após pagamento concluído.
- [x] Exibir mensagem de relacionamento melhorado.
- [x] Pré-contextualizar que a nova solicitação considera histórico anterior.
- [x] Integrar com crédito progressivo já existente.
- [x] Permitir comparar solicitação anterior e nova oportunidade.

### Critérios de aceite

- [x] CTA deve aparecer apenas quando o ciclo anterior permitir nova solicitação.
- [x] Nova solicitação deve seguir consentimento/análise conforme necessário.
- [x] Usuário deve perceber continuidade entre ciclos.
- [x] A task não deve permitir múltiplas solicitações conflitantes sem estado claro.
- [x] A task não deve ignorar risco de fraude ou monitoramento anterior.

## 11. Task J - Ajustes no admin, se viável

Planejar reflexos administrativos do ciclo completo sem transformar o admin em prioridade antes do fluxo do usuário.

### Escopo

- [x] Mostrar crédito liberado simulado.
- [x] Mostrar empréstimo ativo.
- [x] Mostrar pagamento simulado.
- [x] Mostrar ciclo concluído.
- [x] Mostrar evolução de confiança.
- [x] Permitir filtrar ou identificar solicitações por etapa do ciclo.

### Critérios de aceite

- [x] Admin deve enxergar o estado do ciclo sem abrir várias telas.
- [x] Detalhe da solicitação deve mostrar histórico relevante.
- [x] Estados novos devem ser legíveis para operação e demo.
- [x] A task deve ser adiada se ameaçar atrasar o fluxo principal do usuário.
- [x] A task não deve substituir a área do usuário como foco da demo.

## 12. Ordem recomendada de implementação

Ordem sugerida pensando em menor risco, maior impacto visual e reutilização do que já existe:

- [x] 1. Task A - Área do usuário como hub da jornada.
- [x] 2. Task B - Conexão bancária simulada com estado simples.
- [x] 3. Task C - Jornada de solicitação melhorada.
- [x] 4. Task D - Etapa visual de análise.
- [x] 5. Task E - Recebimento de crédito simulado.
- [x] 6. Task F - Empréstimo ativo.
- [x] 7. Task G - Pagamento simulado.
- [x] 8. Task H - Evolução de confiança e novo limite.
- [x] 9. Task I - Nova solicitação após pagamento.
- [x] 10. Task J - Ajustes no admin, se houver tempo.

## 13. Critérios gerais de aceite

- [x] O fluxo completo deve ser demonstrável com um usuário comum.
- [x] A área do usuário deve deixar claro qual é o próximo passo.
- [x] Estados vazios, pendentes, concluídos e de erro devem ter texto claro.
- [x] Nenhuma etapa deve prometer crédito real, pagamento real ou conexão bancária real.
- [x] O usuário deve entender a diferença entre valor solicitado, valor aprovado e limite potencial.
- [x] O ciclo deve mostrar antes e depois: confiança, limite e histórico.
- [x] Cada task deve ser validável manualmente no navegador.
- [x] Testes automatizados podem ser planejados depois por fluxo, mas não fazem parte deste TODO2 inicial.
- [x] Alterações de schema devem ser pequenas, explícitas e só feitas quando a task realmente precisar.
- [x] Motores existentes devem ser reaproveitados antes de criar nova lógica.
- [x] O admin deve vir depois do fluxo do usuário, salvo ajuste pequeno que ajude a demo.
