"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireCurrentUser } from "@/lib/auth/profile"
import { getFieldErrors, type FormActionState } from "@/lib/form-action"
import { createClient } from "@/lib/supabase/server"
import { Signup } from "@/validation/auth"

export type CreateProfileState = FormActionState<
  "name" | "cpf" | "mock_profile"
>

export async function createProfile(
  _prevState: CreateProfileState,
  formData: FormData
): Promise<CreateProfileState> {
  const parsedProfile = Signup.safeParse({
    name: formData.get("name"),
    cpf: formData.get("cpf"),
    mock_profile: formData.get("mock_profile"),
  })

  if (!parsedProfile.success) {
    return {
      ok: false,
      fieldErrors: getFieldErrors<"name" | "cpf" | "mock_profile">(
        parsedProfile.error
      ),
    }
  }

  const user = await requireCurrentUser()

  const supabase = await createClient()
  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    name: parsedProfile.data.name,
    cpf: parsedProfile.data.cpf,
    mock_profile: parsedProfile.data.mock_profile,
  })

  if (error?.code === "23505") {
    if (error.message.includes("profiles_pkey")) {
      redirect("/minha-conta")
    }

    return {
      ok: false,
      fieldErrors: {
        cpf: ["CPF já cadastrado"],
      },
    }
  }

  if (error) {
    return {
      ok: false,
      formError: "Não foi possível concluir o cadastro agora",
    }
  }

  revalidatePath("/", "layout")
  redirect("/minha-conta")
}
