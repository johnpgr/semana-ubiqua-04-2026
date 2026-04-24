import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

import type { EmailCommunicationBundle } from "./index"
import { renderCommunicationHtml } from "./renderHtml"
import {
  routeCommunicationRecipient,
  type EmailDeliveryRecord,
} from "./routing"

export {
  deliveryOutcomeToAuditAction,
  routeCommunicationRecipient,
} from "./routing"
export type {
  EmailDeliveryOutcome,
  EmailDeliveryRecord,
} from "./routing"

export type BundleDeliveryResult = {
  deliveries: EmailDeliveryRecord[]
}

export type SendEmailBundleInput = {
  supabase: SupabaseClient<Database>
  bundle: EmailCommunicationBundle
  recipientEmail: string | null | undefined
  requestId: string
}

export async function sendEmailBundle(
  input: SendEmailBundleInput,
): Promise<BundleDeliveryResult> {
  const operationsInbox = process.env.EMAIL_OPERATIONS_INBOX ?? null

  const deliveries = await Promise.all(
    input.bundle.communications.map((communication) =>
      sendSingleCommunication({
        supabase: input.supabase,
        communication,
        recipient: routeCommunicationRecipient(
          communication,
          input.recipientEmail,
          operationsInbox,
        ),
        requestId: input.requestId,
      }),
    ),
  )

  return { deliveries }
}

async function sendSingleCommunication(params: {
  supabase: SupabaseClient<Database>
  communication: EmailCommunicationBundle["communications"][number]
  recipient: string | null
  requestId: string
}): Promise<EmailDeliveryRecord> {
  const { supabase, communication, recipient, requestId } = params

  if (!recipient) {
    return {
      templateKey: communication.audit.templateKey,
      communicationType: communication.type,
      audience: communication.audience,
      recipient: null,
      status: "skipped",
      messageId: null,
      error: null,
    }
  }

  const rendered = renderCommunicationHtml(communication)

  const { data, error } = await supabase.functions.invoke("send-email", {
    body: {
      to: recipient,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      templateKey: communication.audit.templateKey,
      requestId,
    },
  })

  if (error) {
    return {
      templateKey: communication.audit.templateKey,
      communicationType: communication.type,
      audience: communication.audience,
      recipient,
      status: "failed",
      messageId: null,
      error: error.message ?? String(error),
    }
  }

  const payload = (data ?? {}) as {
    ok?: boolean
    dryRun?: boolean
    messageId?: string
    error?: string
  }

  if (payload.ok === false) {
    return {
      templateKey: communication.audit.templateKey,
      communicationType: communication.type,
      audience: communication.audience,
      recipient,
      status: "failed",
      messageId: null,
      error: payload.error ?? "Unknown send error",
    }
  }

  if (payload.dryRun) {
    return {
      templateKey: communication.audit.templateKey,
      communicationType: communication.type,
      audience: communication.audience,
      recipient,
      status: "dry_run",
      messageId: null,
      error: null,
    }
  }

  return {
    templateKey: communication.audit.templateKey,
    communicationType: communication.type,
    audience: communication.audience,
    recipient,
    status: "sent",
    messageId: payload.messageId ?? null,
    error: null,
  }
}
