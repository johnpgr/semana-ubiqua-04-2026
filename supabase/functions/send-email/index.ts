// Supabase Edge Function: send-email
// Receives a rendered communication and sends it via SMTP using denomailer.
// Runs in dry-run mode when SMTP credentials are not configured.

// @ts-expect-error Deno remote import, resolved at runtime on the edge runtime.
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

type SendEmailRequest = {
  to: string
  subject: string
  html: string
  text: string
  templateKey: string
  requestId: string
}

const REQUIRED_FIELDS: Array<keyof SendEmailRequest> = [
  "to",
  "subject",
  "html",
  "text",
  "templateKey",
  "requestId",
]

// @ts-expect-error Deno global, only defined at runtime.
const env = Deno.env

// @ts-expect-error Deno global.
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405)
  }

  let body: SendEmailRequest
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400)
  }

  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = body[field]
    return typeof value !== "string" || value.length === 0
  })

  if (missing.length > 0) {
    return jsonResponse(
      { ok: false, error: `Missing required fields: ${missing.join(", ")}` },
      400,
    )
  }

  const host = env.get("SMTP_HOST") ?? ""
  const portRaw = env.get("SMTP_PORT") ?? ""
  const username = env.get("SMTP_USERNAME") ?? ""
  const password = env.get("SMTP_PASSWORD") ?? ""
  const fromEmail = env.get("SMTP_FROM_EMAIL") ?? ""
  const fromName = env.get("SMTP_FROM_NAME") ?? "OpenCred"

  if (!host || !portRaw || !username || !password || !fromEmail) {
    console.log(
      `[send-email] dry-run (missing SMTP config) template=${body.templateKey} to=${body.to}`,
    )
    return jsonResponse({ ok: true, dryRun: true })
  }

  const port = Number.parseInt(portRaw, 10)
  if (!Number.isFinite(port) || port <= 0) {
    return jsonResponse({ ok: false, error: "Invalid SMTP_PORT" }, 500)
  }

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: port === 465,
      auth: {
        username,
        password,
      },
    },
  })

  try {
    await client.send({
      from: `${fromName} <${fromEmail}>`,
      to: body.to,
      subject: body.subject,
      content: body.text,
      html: body.html,
    })
    await client.close()
  } catch (error) {
    try {
      await client.close()
    } catch {
      // ignore secondary close errors
    }
    const message = error instanceof Error ? error.message : String(error)
    console.error(
      `[send-email] send failed template=${body.templateKey} to=${body.to} error=${message}`,
    )
    return jsonResponse({ ok: false, error: message }, 502)
  }

  return jsonResponse({ ok: true, messageId: body.templateKey })
})

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
