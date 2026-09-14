import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// ---------------------------------------------------------------------------
// Mock data — swap this out for real data later.
// ---------------------------------------------------------------------------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];

const REGIONS = ["North America", "EMEA", "APAC", "LATAM"];

const REGION_COLORS = {
  "North America": "#5B8DEF",
  EMEA: "#F2B84B",
  APAC: "#6FCF97",
  LATAM: "#EB6E6E",
};

// deterministic pseudo-random so numbers don't jump around on re-render
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildMonthlyData() {
  const rand = seeded(42);
  let base = { "North America": 420, EMEA: 260, APAC: 180, LATAM: 90 };
  return MONTHS.map((month, i) => {
    const row = { month };
    let total = 0;
    REGIONS.forEach((region) => {
      const drift = (rand() - 0.35) * 40 + i * 6;
      base[region] = Math.max(40, base[region] + drift);
      const val = Math.round(base[region]);
      row[region] = val;
      total += val;
    });
    row.total = total;
    return row;
  });
}

const MONTHLY = buildMonthlyData();

const PIPELINE_STAGES = [
  { stage: "Prospecting", value: 812, color: "#3D5A80" },
  { stage: "Qualified", value: 540, color: "#5B8DEF" },
  { stage: "Proposal", value: 318, color: "#F2B84B" },
  { stage: "Negotiation", value: 176, color: "#6FCF97" },
  { stage: "Closed Won", value: 96, color: "#2E7D5B" },
];

const REPS = [
  { name: "Priya Nair", region: "APAC", deals: 18, closed: 320000, quota: 300000 },
  { name: "Marcus Webb", region: "North America", deals: 24, closed: 481000, quota: 450000 },
  { name: "Sofia Marchetti", region: "EMEA", deals: 15, closed: 264000, quota: 300000 },
  { name: "Diego Alvarez", region: "LATAM", deals: 12, closed: 198000, quota: 180000 },
  { name: "Grace Kim", region: "APAC", deals: 20, closed: 356000, quota: 340000 },
  { name: "Owen Fitzgerald", region: "North America", deals: 21, closed: 402000, quota: 420000 },
  { name: "Amara Chukwu", region: "EMEA", deals: 17, closed: 289000, quota: 260000 },
];

const CURRENT_MONTH = MONTHLY[MONTHLY.length - 1];
const PREV_MONTH = MONTHLY[MONTHLY.length - 2];

function formatUSD(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

function pctChange(curr, prev) {
  return ((curr - prev) / prev) * 100;
}

// ---------------------------------------------------------------------------

const CARD_BG = "#141B2D";
const PAGE_BG = "#0B0F1A";
const BORDER = "#212B42";
const TEXT_MUTED = "#8A93A8";
const TEXT_MAIN = "#EDEFF4";
const ACCENT = "#F2B84B";
const POSITIVE = "#6FCF97";
const NEGATIVE = "#EB6E6E";

function KPICard({ label, value, delta, sub }) {
  const isPositive = delta >= 0;
  return (
    <div
      style={{
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: 12.5, color: TEXT_MUTED, letterSpacing: 0.2 }}>{label}</span>
      <span style={{ fontSize: 26, fontWeight: 600, color: TEXT_MAIN, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: isPositive ? POSITIVE : NEGATIVE,
          }}
        >
          {isPositive ? "+" : ""}
          {delta.toFixed(1)}%
        </span>
        <span style={{ fontSize: 12, color: TEXT_MUTED }}>{sub}</span>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children, right }) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: TEXT_MAIN }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: "#1B2438",
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12.5,
        color: TEXT_MAIN,
      }}
    >
      <div style={{ color: TEXT_MUTED, marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color || p.fill }} />
          <span>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>{formatter ? formatter(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function SalesDashboard() {
  const [activeRegions, setActiveRegions] = useState(REGIONS);
  const [repSort, setRepSort] = useState("closed");

  const toggleRegion = (region) => {
    setActiveRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const filteredMonthly = useMemo(
    () =>
      MONTHLY.map((row) => {
        const filtered = { month: row.month };
        let total = 0;
        REGIONS.forEach((r) => {
          if (activeRegions.includes(r)) {
            filtered[r] = row[r];
            total += row[r];
          }
        });
        filtered.total = total;
        return filtered;
      }),
    [activeRegions]
  );

  const filteredReps = useMemo(
    () =>
      REPS.filter((r) => activeRegions.includes(r.region)).sort((a, b) => {
        if (repSort === "closed") return b.closed - a.closed;
        if (repSort === "deals") return b.deals - a.deals;
        if (repSort === "attainment") return b.closed / b.quota - a.closed / a.quota;
        return 0;
      }),
    [activeRegions, repSort]
  );

  const totalClosed = filteredMonthly.reduce((sum, m) => sum + m.total, 0);
  const currTotal = filteredMonthly[filteredMonthly.length - 1]?.total || 0;
  const prevTotal = filteredMonthly[filteredMonthly.length - 2]?.total || 1;
  const totalPipeline = PIPELINE_STAGES.reduce((s, p) => s + p.value, 0);
  const avgDealSize =
    filteredReps.reduce((s, r) => s + r.closed, 0) / Math.max(1, filteredReps.reduce((s, r) => s + r.deals, 0));
  const winRate = (PIPELINE_STAGES[4].value / PIPELINE_STAGES[0].value) * 100;

  return (
    <div
      style={{
        background: PAGE_BG,
        minHeight: "100vh",
        fontFamily:
          "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        color: TEXT_MAIN,
        padding: "28px 28px 40px",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 22,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: TEXT_MAIN }}>Revenue Overview</div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 3 }}>
            Q1–Q3 FY26 · figures in USD · sample data
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {REGIONS.map((region) => {
            const active = activeRegions.includes(region);
            return (
              <button
                key={region}
                onClick={() => toggleRegion(region)}
                style={{
                  cursor: "pointer",
                  border: `1px solid ${active ? REGION_COLORS[region] : BORDER}`,
                  background: active ? `${REGION_COLORS[region]}22` : "transparent",
                  color: active ? TEXT_MAIN : TEXT_MUTED,
                  borderRadius: 999,
                  padding: "6px 14px",
                  fontSize: 12.5,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  transition: "all 0.15s ease",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: REGION_COLORS[region],
                    opacity: active ? 1 : 0.4,
                  }}
                />
                {region}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <KPICard
          label="Revenue this month"
          value={formatUSD(currTotal)}
          delta={pctChange(currTotal, prevTotal)}
          sub="vs. last month"
        />
        <KPICard
          label="Total pipeline value"
          value={formatUSD(totalPipeline)}
          delta={4.2}
          sub="active deals"
        />
        <KPICard
          label="Avg. deal size"
          value={formatUSD(Math.round(avgDealSize || 0))}
          delta={-1.8}
          sub="closed-won deals"
        />
        <KPICard
          label="Win rate"
          value={`${winRate.toFixed(1)}%`}
          delta={2.6}
          sub="prospecting → closed"
        />
      </div>

      {/* Main grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <SectionCard title="Revenue by region" subtitle="Monthly, stacked by region">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={filteredMonthly} margin={{ left: -14, right: 8, top: 4, bottom: 0 }}>
              <defs>
                {REGIONS.map((r) => (
                  <linearGradient key={r} id={`grad-${r}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={REGION_COLORS[r]} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={REGION_COLORS[r]} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke={BORDER} strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: TEXT_MUTED, fontSize: 12 }} axisLine={{ stroke: BORDER }} tickLine={false} />
              <YAxis tick={{ fill: TEXT_MUTED, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatUSD(v)} />
              <Tooltip content={<CustomTooltip formatter={formatUSD} />} />
              {activeRegions.map((r) => (
                <Area
                  key={r}
                  type="monotone"
                  dataKey={r}
                  name={r}
                  stackId="1"
                  stroke={REGION_COLORS[r]}
                  fill={`url(#grad-${r})`}
                  strokeWidth={1.75}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Pipeline funnel" subtitle="Open deal value by stage">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={PIPELINE_STAGES} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 0 }}>
              <CartesianGrid stroke={BORDER} strokeDasharray="3 4" horizontal={false} />
              <XAxis type="number" tick={{ fill: TEXT_MUTED, fontSize: 11.5 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatUSD(v)} />
              <YAxis
                type="category"
                dataKey="stage"
                width={92}
                tick={{ fill: TEXT_MUTED, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip formatter={formatUSD} />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="value" name="Value" radius={[0, 4, 4, 0]}>
                {PIPELINE_STAGES.map((s) => (
                  <Cell key={s.stage} fill={s.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr",
          gap: 14,
        }}
      >
        <SectionCard title="Cumulative revenue" subtitle="Running total, filtered regions">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={filteredMonthly.reduce((acc, row, i) => {
                const prevCum = i > 0 ? acc[i - 1].cumulative : 0;
                acc.push({ month: row.month, cumulative: prevCum + row.total });
                return acc;
              }, [])}
              margin={{ left: -10, right: 8, top: 4, bottom: 0 }}
            >
              <CartesianGrid stroke={BORDER} strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: TEXT_MUTED, fontSize: 12 }} axisLine={{ stroke: BORDER }} tickLine={false} />
              <YAxis tick={{ fill: TEXT_MUTED, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatUSD(v)} />
              <Tooltip content={<CustomTooltip formatter={formatUSD} />} />
              <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke={ACCENT} strokeWidth={2.25} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard
          title="Top reps"
          subtitle="Closed-won revenue and quota attainment"
          right={
            <select
              value={repSort}
              onChange={(e) => setRepSort(e.target.value)}
              style={{
                background: "#1B2438",
                color: TEXT_MAIN,
                border: `1px solid ${BORDER}`,
                borderRadius: 6,
                fontSize: 12,
                padding: "5px 8px",
              }}
            >
              <option value="closed">Sort: Revenue</option>
              <option value="deals">Sort: Deals</option>
              <option value="attainment">Sort: Attainment</option>
            </select>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredReps.slice(0, 6).map((rep) => {
              const attainment = (rep.closed / rep.quota) * 100;
              return (
                <div key={rep.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 118, fontSize: 12.5, color: TEXT_MAIN, flexShrink: 0 }}>{rep.name}</div>
                  <div style={{ width: 74, fontSize: 11.5, color: TEXT_MUTED, flexShrink: 0 }}>{rep.region}</div>
                  <div style={{ flex: 1, background: BORDER, borderRadius: 4, height: 7, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.min(100, attainment)}%`,
                        height: "100%",
                        background: attainment >= 100 ? POSITIVE : ACCENT,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <div style={{ width: 64, fontSize: 12.5, color: TEXT_MAIN, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                    {formatUSD(rep.closed)}
                  </div>
                  <div style={{ width: 44, fontSize: 11.5, color: TEXT_MUTED, textAlign: "right", flexShrink: 0 }}>
                    {attainment.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
