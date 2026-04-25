import assert from "node:assert/strict"

import {
  buildOpenFinanceDestination,
  buildStoredOpenFinanceConnection,
  normalizeOpenFinanceConnection,
  OPEN_FINANCE_FALLBACK_INSTITUTION,
} from "../../lib/open-finance-connection"

type NamedTest = {
  name: string
  run: () => void
}

export const openFinanceConnectionTests: NamedTest[] = [
  {
    name: "Open Finance stores selected known institution",
    run: () => {
      const connection = buildStoredOpenFinanceConnection({
        connectedAt: "2026-04-25T10:00:00.000Z",
        institutionName: "Nubank",
      })

      assert.equal(connection.institutionName, "Nubank")
      assert.equal(connection.accountLast4, "4829")
      assert.equal(
        buildOpenFinanceDestination(connection),
        "Nubank · Conta •••• 4829"
      )
    },
  },
  {
    name: "Open Finance supports custom institution name",
    run: () => {
      const connection = buildStoredOpenFinanceConnection({
        connectedAt: "2026-04-25T10:00:00.000Z",
        institutionName: " Banco XPTO  ",
      })

      assert.equal(connection.institutionName, "Banco XPTO")
      assert.match(connection.accountLast4, /^\d{4}$/)
      assert.equal(
        buildOpenFinanceDestination(connection),
        `Banco XPTO · Conta •••• ${connection.accountLast4}`
      )
    },
  },
  {
    name: "Open Finance migrates legacy connection shape",
    run: () => {
      const connection = normalizeOpenFinanceConnection({
        status: "connected",
        connectedAt: "2026-04-25T10:00:00.000Z",
        institution: "Inter",
        scopes: ["Entradas financeiras"],
      })

      assert.equal(connection?.institutionName, "Inter")
      assert.equal(connection?.accountLast4, "1937")
      assert.deepEqual(connection?.authorizedScopes, ["Entradas financeiras"])
    },
  },
  {
    name: "Open Finance uses neutral fallback without institution name",
    run: () => {
      const connection = normalizeOpenFinanceConnection({
        status: "connected",
        connectedAt: "2026-04-25T10:00:00.000Z",
      })

      assert.equal(
        connection?.institutionName,
        OPEN_FINANCE_FALLBACK_INSTITUTION
      )
      assert.equal(
        buildOpenFinanceDestination(connection),
        "Instituição conectada"
      )
    },
  },
]
