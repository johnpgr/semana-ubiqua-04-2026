import { z } from "zod"

const REPEATED_DIGITS = /^(\d)\1{10}$/

export function normalizeCpf(raw: string) {
  return raw.replace(/\D/g, "")
}

export const Cpf = z
  .string()
  .transform((value) => normalizeCpf(value))
  .refine((value) => value.length === 11, "CPF deve ter 11 dígitos")
  .refine((value) => !REPEATED_DIGITS.test(value), "CPF inválido")

export type Cpf = z.infer<typeof Cpf>

export const CpfSchema = Cpf
