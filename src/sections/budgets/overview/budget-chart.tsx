"use client";

import "./budget-chart.css";
import { useId, useMemo } from "react";
import { Area, AreaChart, Customized, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer } from "src/components/ui/chart";
import { BudgetTimeline } from "src/types/budget/types";
import { asDate, dateFormat } from "src/types/utils/methods";
import { cn } from "src/utils";
import { BudgetMetric, formatMetricLabel, metricValue, useBudgetMetric } from "./budget-metric";

type Row = {
  day: number;
  date: string;
  value: number | null;
  projected: number | null;
  fillPos: number | null;
  fillNeg: number | null;
};
type Axis = { scale?: (v: number) => number };

const POS = "hsl(160 32% 40%)";
const NEG = "hsl(4 38% 52%)";
const MID = "hsl(40 12% 48%)";
const CARD = "hsl(var(--card))";

const days = (date: string, begin: string) =>
  Math.round((asDate(date).getTime() - asDate(begin).getTime()) / 86_400_000);

const scaleOf = (map?: Record<string, Axis>) => map && Object.values(map)[0]?.scale;

const fmtDate = (date: string, begin: string, end: string) =>
  dateFormat(date, { excludeYear: asDate(begin).getFullYear() === asDate(end).getFullYear() });

function LineGradient({
  id,
  domain: [min, max],
  yAxisMap,
  mono,
}: {
  id: string;
  domain: [number, number];
  yAxisMap?: Record<string, Axis>;
  mono: boolean;
}) {
  const s = scaleOf(yAxisMap);
  if (!s) return null;
  const y0 = s(max);
  const y1 = s(min);
  if (!Number.isFinite(y1 - y0) || y1 === y0) return null;
  const z = mono ? null : Math.min(1, Math.max(0, (s(0) - y0) / (y1 - y0)));
  return (
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={y0} x2={0} y2={y1}>
        {mono || z == null ? (
          <>
            <stop offset={0} stopColor={POS} />
            <stop offset={1} stopColor={POS} />
          </>
        ) : (
          <>
            <stop offset={0} stopColor={POS} />
            <stop offset={Math.max(0, z - 0.06)} stopColor={POS} />
            <stop offset={z} stopColor={MID} />
            <stop offset={Math.min(1, z + 0.06)} stopColor={NEG} />
            <stop offset={1} stopColor={NEG} />
          </>
        )}
      </linearGradient>
    </defs>
  );
}

function Overlay({
  row,
  begin,
  end,
  totalDays,
  mono,
  metric,
  xAxisMap,
  yAxisMap,
  width = 0,
  height = 0,
}: {
  row: Row;
  begin: string;
  end: string;
  totalDays: number;
  mono: boolean;
  metric: BudgetMetric;
  xAxisMap?: Record<string, Axis>;
  yAxisMap?: Record<string, Axis>;
  width?: number;
  height?: number;
}) {
  const xs = scaleOf(xAxisMap);
  const ys = scaleOf(yAxisMap);
  if (!xs || !ys || !height || row.value == null) return null;

  const cx = xs(row.day);
  const cy = ys(row.value);
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;

  const fill = mono || row.value >= 0 ? POS : NEG;
  const text = formatMetricLabel(row.value, metric);
  const bw = Math.max(72, text.length * 6.6 + 16);
  const bh = 22;
  const tip = 5;
  const gap = 8;
  const bx = Math.min(Math.max(cx, bw / 2 + 2), Math.max(bw / 2 + 2, width - bw / 2 - 2));
  const tipX = cx - bx;
  const by = cy - gap;
  const dateY = height - 3;
  const dateStyle = { fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 500 as const };

  return (
    <g style={{ pointerEvents: "none" }} className="tabular-nums">
      <g className="budget-chart-end-dot">
        <circle cx={cx} cy={cy} r={3.5} fill={fill} />
        <g transform={`translate(${bx}, ${by})`}>
          <path d={`M${tipX} 0 L${tipX - tip} ${-tip - 1} L${tipX + tip} ${-tip - 1} Z`} fill={fill} />
          <rect x={-bw / 2} y={-bh - tip} width={bw} height={bh} rx={6} fill={fill} />
          <text
            textAnchor="middle"
            y={-tip - bh / 2}
            dominantBaseline="central"
            fill={CARD}
            fontSize={11}
            fontWeight={600}
          >
            {text}
          </text>
        </g>
      </g>
      <text x={xs(0)} y={dateY} textAnchor="start" style={dateStyle}>
        {fmtDate(begin, begin, end)}
      </text>
      <text x={xs(totalDays)} y={dateY} textAnchor="end" style={dateStyle}>
        {fmtDate(end, begin, end)}
      </text>
    </g>
  );
}

const quiet = {
  connectNulls: false,
  activeDot: false,
  dot: false,
  legendType: "none",
  tooltipType: "none",
  animationEasing: "ease-out",
} as const;

export function BudgetTimelineChart({ timeline, className }: { timeline: BudgetTimeline; className?: string }) {
  const metric = useBudgetMetric();
  const mono = metric !== BudgetMetric.Net;
  const uid = useId().replace(/:/g, "");
  const [fp, fn, lg] = [`fp-${uid}`, `fn-${uid}`, `lg-${uid}`];
  const { begin, end, points } = timeline;
  const totalDays = Math.max(1, days(end, begin));
  const config = {
    value: { color: POS },
    projected: { color: POS },
    fillPos: { color: POS },
    fillNeg: { color: mono ? POS : NEG },
  } satisfies ChartConfig;

  const { rows, endRow } = useMemo(() => {
    const rows: Row[] = points.map((p) => {
      const value = metricValue(p.net, p.amounts, metric);
      return {
        day: days(p.date, begin),
        date: p.date,
        value,
        projected: null,
        fillPos: Math.max(0, value),
        fillNeg: Math.min(0, value),
      };
    });
    const last = rows.at(-1);
    if (last && last.day < totalDays) {
      last.projected = last.value;
      rows.push({ day: totalDays, date: end, value: null, projected: last.value, fillPos: null, fillNeg: null });
    }
    return { rows, endRow: rows[Math.max(0, points.length - 1)] };
  }, [points, begin, end, totalDays, metric]);

  const domain = useMemo<[number, number]>(() => {
    const vals = rows.map((r) => r.value).filter((v): v is number => v != null);
    const min = Math.min(0, ...vals);
    const max = Math.max(0, ...vals);
    if (!vals.length || (min === max && max === 0)) return [0, 300_000];
    const pad = Math.max((max - min) * 0.12, 5_000);
    return [min < 0 ? min - pad : 0, max + pad];
  }, [rows]);

  const stroke = `url(#${lg})`;

  return (
    <ChartContainer
      config={config}
      className={cn(
        "budget-chart-enter aspect-auto h-full w-full cursor-pointer overflow-visible [&_.recharts-surface]:cursor-pointer [&_.recharts-surface]:overflow-visible",
        className
      )}
    >
      <AreaChart data={rows} margin={{ top: 30, right: 10, left: 10, bottom: 18 }}>
        <defs>
          <linearGradient id={fp} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-fillPos)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--color-fillPos)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={fn} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-fillNeg)" stopOpacity={0} />
            <stop offset="100%" stopColor="var(--color-fillNeg)" stopOpacity={0.18} />
          </linearGradient>
        </defs>
        <Customized
          component={(p: { yAxisMap?: Record<string, Axis> }) => (
            <LineGradient id={lg} domain={domain} yAxisMap={p.yAxisMap} mono={mono} />
          )}
        />
        <XAxis type="number" dataKey="day" domain={[0, totalDays]} hide />
        <YAxis type="number" domain={domain} hide />
        <Area
          {...quiet}
          type="monotone"
          dataKey="fillPos"
          baseValue={0}
          stroke="none"
          fill={`url(#${fp})`}
          animationDuration={700}
          animationBegin={80}
        />
        <Area
          {...quiet}
          type="monotone"
          dataKey="fillNeg"
          baseValue={0}
          stroke="none"
          fill={`url(#${fn})`}
          animationDuration={700}
          animationBegin={80}
        />
        <Area
          {...quiet}
          type="monotone"
          dataKey="value"
          stroke={stroke}
          strokeWidth={1.75}
          fill="none"
          animationDuration={650}
        />
        <Area
          {...quiet}
          type="linear"
          dataKey="projected"
          stroke={stroke}
          strokeWidth={1.75}
          strokeDasharray="2 5"
          strokeOpacity={0.45}
          fill="none"
          animationDuration={450}
          animationBegin={420}
        />
        <Customized
          component={(p: {
            xAxisMap?: Record<string, Axis>;
            yAxisMap?: Record<string, Axis>;
            width?: number;
            height?: number;
          }) => (
            <Overlay
              key={metric}
              row={endRow}
              begin={begin}
              end={end}
              totalDays={totalDays}
              mono={mono}
              metric={metric}
              {...p}
            />
          )}
        />
      </AreaChart>
    </ChartContainer>
  );
}
