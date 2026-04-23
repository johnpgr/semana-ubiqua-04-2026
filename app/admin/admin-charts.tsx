"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  Rectangle,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { RectRadius } from "recharts/types/shape/Rectangle"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AdminRequestRow } from "./page"

function buildScoreBins(requests: AdminRequestRow[]) {
  const bins = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 100}-${i * 100 + 100}`,
    count: 0,
  }))

  for (const r of requests) {
    if (!r.score) continue
    const v = r.score.value
    const idx = Math.min(9, Math.floor(v / 100))
    bins[idx].count++
  }

  return bins
}

const DECISION_COLORS: Record<string, string> = {
  approved: "#22c55e",
  approved_reduced: "#84cc16",
  further_review: "#f59e0b",
  denied: "#ef4444",
}

function buildDecisionCounts(requests: AdminRequestRow[]) {
  const counts: Record<string, number> = {}
  for (const r of requests) {
    if (!r.decision) continue
    counts[r.decision] = (counts[r.decision] ?? 0) + 1
  }

  const labels: Record<string, string> = {
    approved: "Aprovado",
    approved_reduced: "Aprovado reduzido",
    further_review: "Revisão manual",
    denied: "Negado",
  }

  return Object.entries(counts).map(([key, value]) => ({
    name: labels[key] ?? key,
    value,
    fill: DECISION_COLORS[key] ?? "#8884d8",
  }))
}

const STATUS_COLORS: Record<string, string> = {
  awaiting_consent: "#94a3b8",
  collecting_data: "#3b82f6",
  scoring: "#a855f7",
  decided: "#10b981",
}

function buildStatusCounts(requests: AdminRequestRow[]) {
  const counts: Record<string, number> = {}
  for (const r of requests) {
    counts[r.status] = (counts[r.status] ?? 0) + 1
  }

  const labels: Record<string, string> = {
    awaiting_consent: "Aguardando consentimento",
    collecting_data: "Coletando dados",
    scoring: "Scoring",
    decided: "Decidido",
  }

  return Object.entries(counts).map(([key, value]) => ({
    name: labels[key] ?? key,
    value,
    fill: STATUS_COLORS[key] ?? "#8884d8",
  }))
}

const tickStyle = { fontSize: 10 }
const radiusTop = [4, 4, 0, 0] satisfies RectRadius
const radiusRight = [0, 4, 4, 0] satisfies RectRadius

function pieShape(props: unknown) {
  return <Sector {...(props as React.ComponentProps<typeof Sector>)} />
}

function barShape(props: unknown) {
  return <Rectangle {...(props as React.ComponentProps<typeof Rectangle>)} />
}

function decisionLabel(props: { name?: string; value?: number }) {
  return `${props.name ?? ""}: ${props.value ?? 0}`
}

function tooltipFormatter(value: unknown) {
  return [value, "Solicitações"] as [unknown, string]
}

const tooltipFormatterCast =
  tooltipFormatter as unknown as React.ComponentProps<
    typeof Tooltip
  >["formatter"]

const decisionLabelCast = decisionLabel as unknown as React.ComponentProps<
  typeof Pie
>["label"]

export function AdminCharts({ requests }: { requests: AdminRequestRow[] }) {
  const scoreBins = buildScoreBins(requests)
  const decisionData = buildDecisionCounts(requests)
  const statusData = buildStatusCounts(requests)

  const hasData = requests.length > 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Score</CardTitle>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={scoreBins}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={tickStyle} />
                <YAxis allowDecimals={false} tick={tickStyle} />
                <Tooltip formatter={tooltipFormatterCast} />
                <Bar dataKey="count" fill="#3b82f6" radius={radiusTop} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
              Sem dados
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decisões</CardTitle>
        </CardHeader>
        <CardContent>
          {decisionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={decisionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label={decisionLabelCast}
                  labelLine={false}
                  shape={pieShape}
                />
                <Tooltip formatter={tooltipFormatterCast} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
              Sem dados
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={tickStyle} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={tickStyle}
                />
                <Tooltip formatter={tooltipFormatterCast} />
                <Bar dataKey="value" radius={radiusRight} shape={barShape} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
              Sem dados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
