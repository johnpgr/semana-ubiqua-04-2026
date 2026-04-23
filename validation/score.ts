import { z } from "zod"

export const RequestId = z.string().uuid("Solicitação inválida")
export type RequestId = z.infer<typeof RequestId>

