"use client"

import { type ChangeEvent, useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { MOCK_PROFILES, MOCK_PROFILE_LABELS, Signup } from "@/validation/auth"

import { createProfile, type CreateProfileState } from "./actions"

const CREATE_PROFILE_INITIAL_STATE: CreateProfileState = {
  ok: false,
}

export function CadastroForm() {
  const [state, formAction, isPending] = useActionState(
    createProfile,
    CREATE_PROFILE_INITIAL_STATE
  )
  const [values, setValues] = useState({
    name: "",
    cpf: "",
    mock_profile: "",
  })
  const [touched, setTouched] = useState({
    name: false,
    cpf: false,
    mock_profile: false,
  })

  const validation = Signup.safeParse(values)
  const clientFieldErrors = validation.success
    ? {}
    : validation.error.flatten().fieldErrors

  const nameError =
    (touched.name ? clientFieldErrors.name?.[0] : undefined) ??
    state.fieldErrors?.name?.[0]
  const cpfError =
    (touched.cpf ? clientFieldErrors.cpf?.[0] : undefined) ??
    state.fieldErrors?.cpf?.[0]
  const mockProfileError =
    (touched.mock_profile ? clientFieldErrors.mock_profile?.[0] : undefined) ??
    state.fieldErrors?.mock_profile?.[0]

  function markAllTouched() {
    setTouched({
      name: true,
      cpf: true,
      mock_profile: true,
    })
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setValues((current) => ({ ...current, name: event.target.value }))
  }

  function handleCpfChange(event: ChangeEvent<HTMLInputElement>) {
    setValues((current) => ({ ...current, cpf: event.target.value }))
  }

  function handleMockProfileChange(event: ChangeEvent<HTMLSelectElement>) {
    setValues((current) => ({
      ...current,
      mock_profile: event.target.value,
    }))
  }

  function handleNameBlur() {
    setTouched((current) => ({ ...current, name: true }))
  }

  function handleCpfBlur() {
    setTouched((current) => ({ ...current, cpf: true }))
  }

  function handleMockProfileBlur() {
    setTouched((current) => ({ ...current, mock_profile: true }))
  }

  return (
    <form action={formAction} onSubmit={markAllTouched}>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="name">
            Nome completo
          </label>
          <Input
            id="name"
            name="name"
            placeholder="Ana Souza"
            autoComplete="name"
            value={values.name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            aria-invalid={nameError ? true : undefined}
            required
          />
          {nameError ? (
            <p className="text-sm text-destructive">{nameError}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="cpf">
            CPF fictício
          </label>
          <Input
            id="cpf"
            name="cpf"
            placeholder="000.000.000-00"
            inputMode="numeric"
            autoComplete="off"
            value={values.cpf}
            onChange={handleCpfChange}
            onBlur={handleCpfBlur}
            aria-invalid={cpfError ? true : undefined}
            required
          />
          {cpfError ? (
            <p className="text-sm text-destructive">{cpfError}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Use 11 dígitos numéricos. O MVP valida formato e unicidade.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="mock_profile">
            Perfil de demonstração
          </label>
          <NativeSelect
            id="mock_profile"
            name="mock_profile"
            value={values.mock_profile}
            onChange={handleMockProfileChange}
            onBlur={handleMockProfileBlur}
            aria-invalid={mockProfileError ? true : undefined}
            required
          >
            <NativeSelectOption disabled value="">
              Selecione um perfil
            </NativeSelectOption>
            {MOCK_PROFILES.map((profile) => (
              <NativeSelectOption key={profile} value={profile}>
                {MOCK_PROFILE_LABELS[profile]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {mockProfileError ? (
            <p className="text-sm text-destructive">{mockProfileError}</p>
          ) : null}
        </div>

        {state.formError ? (
          <p className="text-sm text-destructive">{state.formError}</p>
        ) : null}
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Salvando..." : "Continuar para solicitação"}
        </Button>
      </CardFooter>
    </form>
  )
}
