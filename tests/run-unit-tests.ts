import { cpfTests } from "./unit/cpf.test"
import { analysisPresentationTests } from "./unit/analysis-presentation.test"
import { creditProgressionTests } from "./unit/credit-progression.test"
import { emailCommunicationTests } from "./unit/email-communication.test"
import { emailRenderTests } from "./unit/email-render.test"
import { explainabilityTests } from "./unit/explainability.test"
import { fraudScoreTests } from "./unit/fraud-score.test"
import { partnerIndicatorTests } from "./unit/partner-indicators.test"
import { postCreditMonitoringTests } from "./unit/post-credit-monitoring.test"
import { scoreEngineTests } from "./unit/score-engine.test"

type NamedTest = {
  name: string
  run: () => void
}

const tests: NamedTest[] = [
  ...cpfTests,
  ...analysisPresentationTests,
  ...scoreEngineTests,
  ...creditProgressionTests,
  ...emailCommunicationTests,
  ...emailRenderTests,
  ...explainabilityTests,
  ...fraudScoreTests,
  ...partnerIndicatorTests,
  ...postCreditMonitoringTests,
]

let failed = 0

for (const testCase of tests) {
  try {
    testCase.run()
    console.log(`ok - ${testCase.name}`)
  } catch (error) {
    failed += 1
    console.error(`not ok - ${testCase.name}`)
    console.error(error)
  }
}

if (failed > 0) {
  console.error(`\n${failed} teste(s) falharam.`)
  process.exitCode = 1
} else {
  console.log(`\nTodos os ${tests.length} testes passaram.`)
}
