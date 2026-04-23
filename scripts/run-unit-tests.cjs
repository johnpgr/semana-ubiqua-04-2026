const fs = require("node:fs")
const path = require("node:path")

const distDir = path.join(process.cwd(), ".codex-test-dist")
const distPackageJson = path.join(distDir, "package.json")
const runnerPath = path.join(distDir, "tests", "run-unit-tests.js")

fs.mkdirSync(distDir, { recursive: true })
fs.writeFileSync(
  distPackageJson,
  JSON.stringify({ type: "commonjs" }, null, 2),
)

require(runnerPath)
