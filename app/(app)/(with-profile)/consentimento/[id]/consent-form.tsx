"use client"

import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { CONSENT_SCOPES, ConsentScopeLabels } from "@/validation/consent"

import { giveConsent, type GiveConsentState } from "./actions"

const GIVE_CONSENT_INITIAL_STATE: GiveConsentState = {
  ok: false,
}

type ConsentFormProps = {
  requestId: string
}

export function ConsentForm({ requestId }: ConsentFormProps) {
  const [state, formAction, isPending] = useActionState(
    giveConsent,
    GIVE_CONSENT_INITIAL_STATE
  )
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const scopesError =
    selectedScopes.length > 0 ? undefined : state.fieldErrors?.scopes?.[0]

  function toggleScope(scope: string, checked: boolean) {
    setSelectedScopes((current) => {
      if (checked) {
        return current.includes(scope) ? current : [...current, scope]
      }

      return current.filter((currentScope) => currentScope !== scope)
    })
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="request_id" value={requestId} />
      {selectedScopes.map((scope) => (
        <input key={scope} type="hidden" name="scopes" value={scope} />
      ))}
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {CONSENT_SCOPES.map((scope) => (
            <div
              key={scope}
              className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/60 p-4"
            >
              <Checkbox
                id={`scope-${scope}`}
                checked={selectedScopes.includes(scope)}
                onCheckedChange={(checked) => {
                  toggleScope(scope, checked)
                }}
                aria-invalid={scopesError ? true : undefined}
              />
              <label htmlFor={`scope-${scope}`} className="space-y-1">
                <span className="block cursor-pointer text-sm font-medium">
                  {ConsentScopeLabels[scope]}
                </span>
                <span className="block text-sm text-muted-foreground">
                  Compartilhamento simulado apenas para a análise desta
                  solicitação.
                </span>
              </label>
            </div>
          ))}
        </div>
        {scopesError ? (
          <p className="text-sm text-destructive">{scopesError}</p>
        ) : null}
        {state.formError ? (
          <p className="text-sm text-destructive">{state.formError}</p>
        ) : null}
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Registrando..." : "Autorizar e continuar"}
        </Button>
      </CardFooter>
    </form>
  )
}
