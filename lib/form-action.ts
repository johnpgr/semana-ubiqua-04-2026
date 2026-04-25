import { z } from "zod"

export type FormFieldErrors<TField extends string = string> = Partial<
  Record<TField, string[]>
>

export type FormActionState<
  TField extends string = string,
  TData = never,
> = {
  ok: boolean
  data?: TData
  formError?: string
  fieldErrors?: FormFieldErrors<TField>
}

export function getFieldErrors<TField extends string>(error: z.ZodError) {
  return error.flatten().fieldErrors as FormFieldErrors<TField>
}
