import assert from "node:assert/strict"

import { CpfSchema, normalizeCpf } from "../../validation/cpf"

type NamedTest = {
  name: string
  run: () => void
}

export const cpfTests: NamedTest[] = [
  {
    name: "normalizeCpf removes mask characters",
    run: () => {
      assert.equal(normalizeCpf("529.982.247-25"), "52998224725")
    },
  },
  {
    name: "CpfSchema accepts a valid CPF with mask",
    run: () => {
      const parsed = CpfSchema.parse("529.982.247-25")

      assert.equal(parsed, "52998224725")
    },
  },
  {
    name: "CpfSchema accepts a valid CPF without mask",
    run: () => {
      const parsed = CpfSchema.parse("52998224725")

      assert.equal(parsed, "52998224725")
    },
  },
  {
    name: "CpfSchema rejects repeated digits",
    run: () => {
      assert.throws(() => CpfSchema.parse("111.111.111-11"))
      assert.throws(() => CpfSchema.parse("00000000000"))
    },
  },
  {
    name: "CpfSchema rejects clearly invalid inputs with wrong length",
    run: () => {
      assert.throws(() => CpfSchema.parse(""))
      assert.throws(() => CpfSchema.parse("123"))
      assert.throws(() => CpfSchema.parse("1234567890"))
      assert.throws(() => CpfSchema.parse("123456789012"))
    },
  },
]
