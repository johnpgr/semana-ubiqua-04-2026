import type { EmailCommunication } from "./index"

export type EmailDeliveryOutcome = "sent" | "failed" | "skipped" | "dry_run"

export type EmailDeliveryRecord = {
  templateKey: string
  communicationType: EmailCommunication["type"]
  audience: EmailCommunication["audience"]
  recipient: string | null
  status: EmailDeliveryOutcome
  messageId: string | null
  error: string | null
}

export function routeCommunicationRecipient(
  communication: EmailCommunication,
  userEmail: string | null | undefined,
  operationsInbox: string | null | undefined,
): string | null {
  if (communication.audience === "user") {
    return userEmail && userEmail.length > 0 ? userEmail : null
  }

  return operationsInbox && operationsInbox.length > 0 ? operationsInbox : null
}

export function deliveryOutcomeToAuditAction(
  status: EmailDeliveryOutcome,
): string {
  switch (status) {
    case "sent":
      return "email_delivery_sent"
    case "failed":
      return "email_delivery_failed"
    case "skipped":
      return "email_delivery_skipped"
    case "dry_run":
      return "email_delivery_dry_run"
  }
}
