import type { EmailCommunication } from "./index"

export type RenderedCommunication = {
  subject: string
  html: string
  text: string
}

const FOOTER_LINE = "OpenCred - canal oficial da sua analise."

export function renderCommunicationHtml(
  communication: EmailCommunication,
): RenderedCommunication {
  const { subject, preview, content } = communication
  const highlightsHtml = content.highlights
    .map((highlight) => `<li style="${HIGHLIGHT_STYLE}">${escapeHtml(highlight)}</li>`)
    .join("")

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="${BODY_STYLE}">
<span style="${PREVIEW_STYLE}">${escapeHtml(preview)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${WRAPPER_STYLE}">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${CARD_STYLE}">
        <tr>
          <td style="${HEADER_STYLE}">
            <h1 style="${H1_STYLE}">${escapeHtml(subject)}</h1>
          </td>
        </tr>
        <tr>
          <td style="${BODY_CELL_STYLE}">
            <p style="${GREETING_STYLE}">${escapeHtml(content.greeting)}</p>
            <p style="${PARAGRAPH_STYLE}">${escapeHtml(content.intro)}</p>
            ${highlightsHtml ? `<ul style="${LIST_STYLE}">${highlightsHtml}</ul>` : ""}
            <p style="${PARAGRAPH_STYLE}">${escapeHtml(content.closing)}</p>
          </td>
        </tr>
        <tr>
          <td style="${FOOTER_STYLE}">${FOOTER_LINE}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  const text = [
    content.greeting,
    "",
    content.intro,
    "",
    ...content.highlights.map((highlight) => `- ${highlight}`),
    "",
    content.closing,
    "",
    FOOTER_LINE,
  ].join("\n")

  return { subject, html, text }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const BODY_STYLE =
  "margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;"
const PREVIEW_STYLE =
  "display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;"
const WRAPPER_STYLE = "background-color:#f5f5f7;"
const CARD_STYLE =
  "max-width:560px;background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;"
const HEADER_STYLE =
  "padding:24px 28px;background-color:#111827;color:#ffffff;"
const H1_STYLE =
  "margin:0;font-size:18px;line-height:1.35;font-weight:600;letter-spacing:-0.01em;"
const BODY_CELL_STYLE = "padding:28px;"
const GREETING_STYLE =
  "margin:0 0 16px 0;font-size:15px;line-height:1.5;font-weight:600;color:#111827;"
const PARAGRAPH_STYLE =
  "margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#374151;"
const LIST_STYLE =
  "margin:0 0 20px 0;padding:0 0 0 20px;font-size:14px;line-height:1.6;color:#374151;"
const HIGHLIGHT_STYLE = "margin:0 0 8px 0;"
const FOOTER_STYLE =
  "padding:16px 28px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;"
