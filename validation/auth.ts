import { z } from "zod"

import type { Database } from "@/lib/supabase/database.types"

import { Cpf } from "./cpf"

type MockProfileEnum = Database["public"]["Enums"]["mock_profile"]

export const MOCK_PROFILES = [
  "motorista_consistente",
  "perfil_forte",
  "autonomo_irregular",
  "fluxo_instavel",
  "historico_insuficiente",
] as const satisfies readonly [MockProfileEnum, ...MockProfileEnum[]]

export const MOCK_PROFILE_LABELS: Record<MockProfileEnum, string> = {
  motorista_consistente: "Motorista consistente",
  perfil_forte: "Perfil forte",
  autonomo_irregular: "Autônomo irregular",
  fluxo_instavel: "Fluxo instável",
  historico_insuficiente: "Histórico insuficiente",
}

export const Email = z
  .string()
  .trim()
  .min(1, "Email é obrigatório")
  .email("Email inválido")
  .transform((value) => value.toLowerCase())

export type Email = z.infer<typeof Email>

export const Otp = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length === 6, "Informe o código de 6 dígitos")

export type Otp = z.infer<typeof Otp>

export const Signup = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cpf: Cpf,
  mock_profile: z.enum(MOCK_PROFILES, {
    message: "Selecione um perfil de demonstração",
  }),
})

export type Signup = z.infer<typeof Signup>

export const EmailSchema = Email
export const OtpSchema = Otp
export const SignupSchema = Signup
