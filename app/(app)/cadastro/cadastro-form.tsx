"use client"

import { useActionState, useReducer } from "react"

import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { MOCK_PROFILES, MOCK_PROFILE_LABELS, Signup } from "@/validation/auth"

import { createProfile, type CreateProfileState } from "./actions"

const CREATE_PROFILE_INITIAL_STATE: CreateProfileState = {
  ok: false,
}

const CADASTRO_INITIAL_VALUES = {
  name: "",
  cpf: "",
  mock_profile: "",
}

const CADASTRO_ALL_TOUCHED = {
  name: true,
  cpf: true,
  mock_profile: true,
}

type CadastroState = {
  values: typeof CADASTRO_INITIAL_VALUES
  touched: Record<keyof typeof CADASTRO_INITIAL_VALUES, boolean>
}

type CadastroAction =
  | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  | React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  | React.FormEvent<HTMLFormElement>

function isCadastroField(
  value: string
): value is keyof typeof CADASTRO_INITIAL_VALUES {
  return value === "name" || value === "cpf" || value === "mock_profile"
}

function cadastroReducer(
  state: CadastroState,
  action: CadastroAction
): CadastroState {
  if (action.type === "submit") {
    return { ...state, touched: CADASTRO_ALL_TOUCHED }
  }

  const target = action.target
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
    return state
  }

  if (!isCadastroField(target.name)) {
    return state
  }

  if (action.type === "change") {
    return {
      ...state,
      values: {
        ...state.values,
        [target.name]: target.value,
      },
    }
  }

  if (action.type === "blur") {
    return {
      ...state,
      touched: {
        ...state.touched,
        [target.name]: true,
      },
    }
  }

  return state
}

export function CadastroForm() {
  const [state, formAction, isPending] = useActionState(
    createProfile,
    CREATE_PROFILE_INITIAL_STATE
  )
  const [{ values, touched }, dispatch] = useReducer(cadastroReducer, {
    values: CADASTRO_INITIAL_VALUES,
    touched: {
      name: false,
      cpf: false,
      mock_profile: false,
    },
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

  return (
    <form
      action={formAction}
      onSubmit={dispatch}
      onChange={dispatch}
      onBlurCapture={dispatch}
    >
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
