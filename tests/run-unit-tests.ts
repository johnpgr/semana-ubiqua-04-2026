import { cpfTests } from "./unit/cpf.test"
import { creditProgressionTests } from "./unit/credit-progression.test"
import { explainabilityTests } from "./unit/explainability.test"
import { fraudScoreTests } from "./unit/fraud-score.test"
import { postCreditMonitoringTests } from "./unit/post-credit-monitoring.test"
import { scoreEngineTests } from "./unit/score-engine.test"

type NamedTest = {
  name: string
  run: () => void
}

const tests: NamedTest[] = [
  ...cpfTests,
  ...scoreEngineTests,
  ...creditProgressionTests,
  ...explainabilityTests,
  ...fraudScoreTests,
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
