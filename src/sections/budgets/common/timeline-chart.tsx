"use client";

import "../overview/budget-chart.css";
import { useId, useMemo } from "react";
import { Area, AreaChart, Customized, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer } from "src/components/ui/chart";
import { asDate, dateFormat } from "src/types/utils/methods";
import { DateString } from "src/types/utils/types";
import { cn } from "src/utils";

type Point = { date: DateString; value: number };
type Row = {
  day: number;
  date: string;
  value: number | null;
  projected: number | null;
  fillPos: number | null;
  fillNeg: number | null;
  fillOver: number | null;
};
type Axis = { scale?: (v: number) => number };

const POS = "hsl(160 32% 40%)";
const NEG = "hsl(4 38% 52%)";
const MID = "hsl(40 12% 48%)";
const CARD = "hsl(var(--card))";
const CHART_REVEAL_MS = 1100;

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
  splitAt,
  warnAbove,
}: {
  id: string;
  domain: [number, number];
  yAxisMap?: Record<string, Axis>;
  mono: boolean;
  splitAt: number;
  warnAbove: boolean;
}) {
  const s = scaleOf(yAxisMap);
  if (!s) return null;
  const y0 = s(max);
  const y1 = s(min);
  if (!Number.isFinite(y1 - y0) || y1 === y0) return null;

  const solid = (color: string) => (
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={y0} x2={0} y2={y1}>
        <stop offset={0} stopColor={color} />
        <stop offset={1} stopColor={color} />
      </linearGradient>
    </defs>
  );

  if (mono) return solid(POS);

  const allGood = warnAbove ? max <= splitAt : min >= splitAt;
  if (allGood) return solid(POS);

  const allBad = warnAbove ? min >= splitAt : max <= splitAt;
  if (allBad) return solid(NEG);

  const z = Math.min(1, Math.max(0, (s(splitAt) - y0) / (y1 - y0)));
  const high = warnAbove ? NEG : POS;
  const low = warnAbove ? POS : NEG;
  return (
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={y0} x2={0} y2={y1}>
        <stop offset={0} stopColor={high} />
        <stop offset={Math.max(0, z - 0.06)} stopColor={high} />
        <stop offset={z} stopColor={MID} />
        <stop offset={Math.min(1, z + 0.06)} stopColor={low} />
        <stop offset={1} stopColor={low} />
      </linearGradient>
    </defs>
  );
}

function FillGradient({
  id,
  domain: [min, max],
  yAxisMap,
  mono,
  splitAt,
  warnAbove,
}: {
  id: string;
  domain: [number, number];
  yAxisMap?: Record<string, Axis>;
  mono: boolean;
  splitAt: number;
  warnAbove: boolean;
}) {
  const s = scaleOf(yAxisMap);
  if (!s) return null;
  const y0 = s(max);
  const y1 = s(min);
  if (!Number.isFinite(y1 - y0) || y1 === y0) return null;

  const solid = (color: string) => (
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={y0} x2={0} y2={y1}>
        <stop offset={0} stopColor={color} stopOpacity={0.2} />
        <stop offset={1} stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );

  if (mono) return solid(POS);

  const allGood = warnAbove ? max <= splitAt : min >= splitAt;
  if (allGood) return solid(POS);

  const allBad = warnAbove ? min >= splitAt : max <= splitAt;
  if (allBad) return solid(NEG);

  const z = Math.min(1, Math.max(0, (s(splitAt) - y0) / (y1 - y0)));
  const high = warnAbove ? NEG : POS;
  const low = warnAbove ? POS : NEG;
  const outer = 0.22;
  const inner = 0.09;
  return (
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={y0} x2={0} y2={y1}>
        <stop offset={0} stopColor={high} stopOpacity={0.2} />
        <stop offset={Math.max(0, z - outer)} stopColor={high} stopOpacity={0.16} />
        <stop offset={Math.max(0, z - inner)} stopColor={MID} stopOpacity={0.1} />
        <stop offset={z} stopColor={MID} stopOpacity={0.08} />
        <stop offset={Math.min(1, z + inner)} stopColor={MID} stopOpacity={0.06} />
        <stop offset={Math.min(1, z + outer)} stopColor={low} stopOpacity={0.04} />
        <stop offset={1} stopColor={low} stopOpacity={0} />
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
  splitAt,
  warnAbove,
  compact,
  formatLabel,
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
  splitAt: number;
  warnAbove: boolean;
  compact: boolean;
  formatLabel?: (value: number) => string;
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

  const over = warnAbove ? row.value > splitAt : row.value < splitAt;
  const fill = mono || !over ? POS : NEG;

  const dot = (
    <g className="budget-chart-end-dot">
      <circle cx={cx} cy={cy} r={3.5} fill={fill} />
    </g>
  );

  if (compact) {
    return (
      <g style={{ pointerEvents: "none" }} className="tabular-nums">
        {dot}
      </g>
    );
  }

  const text = formatLabel?.(row.value) ?? "";
  const bw = Math.max(72, text.length * 6.6 + 16);
  const bh = 22;
  const tip = 5;
  const rx = 6;
  const gap = 8;
  const edgeGap = 8;
  const maxTip = bw / 2 - rx - tip;
  const minBx = Math.min(bw / 2 + 2, cx + maxTip);
  const maxBx = Math.max(bw / 2 + 2, width - bw / 2 + edgeGap, cx - maxTip);
  let bx = Math.min(Math.max(cx, minBx), maxBx);
  if (cx - bx > maxTip) bx = cx - maxTip;
  else if (bx - cx > maxTip) bx = cx + maxTip;
  bx = Math.min(Math.max(bx, minBx), maxBx);
  const tipX = cx - bx;
  const by = cy - gap;
  const dateY = height - 3;
  const dateStyle = { fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 500 as const };

  return (
    <g style={{ pointerEvents: "none" }} className="tabular-nums">
      {dot}
      <g transform={`translate(${Math.round(bx)}, ${Math.round(by)})`}>
        <g className="budget-chart-tooltip">
          <path d={`M${tipX} 0 L${tipX - tip} ${-tip - 1} L${tipX + tip} ${-tip - 1} Z`} fill={fill} />
          <rect x={-bw / 2} y={-bh - tip} width={bw} height={bh} rx={rx} fill={fill} />
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
  /* Entrance is a transparent left-to-right clip on ChartContainer; the
   * value pill bounces in afterwards so it isn't clipped while revealing. */
  isAnimationActive: false,
} as const;

export type TimelineChartProps = {
  begin: DateString;
  end: DateString;
  points: readonly Point[];
  className?: string;
  mono?: boolean;
  splitAt?: number;
  warnAbove?: boolean;
  limit?: number;
  compact?: boolean;
  formatLabel?: (value: number) => string;
  resetKey?: string;
};

export function TimelineChart({
  begin,
  end,
  points,
  className,
  mono = false,
  splitAt = 0,
  warnAbove = false,
  limit,
  compact = false,
  formatLabel,
  resetKey,
}: TimelineChartProps) {
  const uid = useId().replace(/:/g, "");
  const [fp, fn, lg] = [`fp-${uid}`, `fn-${uid}`, `lg-${uid}`];
  const totalDays = Math.max(1, days(end, begin));
  const hasLimit = limit != null;
  const splitFill = hasLimit && !mono && warnAbove;
  const showProjected = !compact;
  const config = {
    value: { color: POS },
    projected: { color: POS },
    fillPos: { color: POS },
    fillNeg: { color: mono ? POS : NEG },
  } satisfies ChartConfig;
  const stroke = `url(#${lg})`;

  const { rows, endRow } = useMemo(() => {
    const rows: Row[] = points.map((p) => {
      const v = p.value;
      return {
        day: days(p.date, begin),
        date: p.date,
        value: v,
        projected: null,
        fillPos: Math.max(0, v),
        fillNeg: Math.min(0, v),
        fillOver: null,
      };
    });
    const last = rows.at(-1);
    if (showProjected && last && last.day < totalDays) {
      last.projected = last.value;
      rows.push({
        day: totalDays,
        date: end,
        value: null,
        projected: last.value,
        fillPos: null,
        fillNeg: null,
        fillOver: null,
      });
    }
    return { rows, endRow: rows[Math.max(0, points.length - 1)] };
  }, [points, begin, end, totalDays, showProjected]);

  const domain = useMemo<[number, number]>(() => {
    const vals = rows.map((r) => r.value).filter((v): v is number => v != null);
    if (hasLimit) vals.push(limit);
    const min = Math.min(0, ...vals);
    const max = Math.max(0, ...vals);
    if (!vals.length || (min === max && max === 0)) return [0, 300_000];
    const pad = Math.max((max - min) * 0.12, 5_000);
    return [min < 0 ? min - pad : 0, max + pad];
  }, [rows, hasLimit, limit]);

  const chartMargin = compact ? { top: 8, right: 0, left: 0, bottom: 2 } : { top: 30, right: 0, left: 0, bottom: 16 };
  const shellClass = cn(
    "aspect-auto h-full w-full overflow-visible [&_.recharts-wrapper]:!overflow-visible [&_.recharts-surface]:overflow-visible [&_svg]:overflow-visible",
    compact ? "pointer-events-none" : "cursor-pointer [&_.recharts-surface]:cursor-pointer",
    className
  );

  return (
    <div
      key={resetKey}
      className="relative h-full w-full"
      style={{ "--budget-chart-reveal-ms": CHART_REVEAL_MS } as React.CSSProperties}
    >
      <ChartContainer config={config} className={cn("budget-chart-enter", shellClass)}>
        <AreaChart data={rows} margin={chartMargin}>
          <defs>
            {!splitFill && (
              <linearGradient id={fp} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-fillPos)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--color-fillPos)" stopOpacity={0} />
              </linearGradient>
            )}
            <linearGradient id={fn} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-fillNeg)" stopOpacity={0} />
              <stop offset="100%" stopColor="var(--color-fillNeg)" stopOpacity={0.18} />
            </linearGradient>
          </defs>
          <Customized
            component={(p: { yAxisMap?: Record<string, Axis> }) => (
              <>
                {splitFill && (
                  <FillGradient
                    id={fp}
                    domain={domain}
                    yAxisMap={p.yAxisMap}
                    mono={mono}
                    splitAt={splitAt}
                    warnAbove={warnAbove}
                  />
                )}
                <LineGradient
                  id={lg}
                  domain={domain}
                  yAxisMap={p.yAxisMap}
                  mono={mono}
                  splitAt={splitAt}
                  warnAbove={warnAbove}
                />
              </>
            )}
          />
          <XAxis type="number" dataKey="day" domain={[0, totalDays]} hide />
          <YAxis type="number" domain={domain} hide width={0} />
          {hasLimit && (
            <ReferenceLine
              y={limit}
              stroke="hsl(var(--border))"
              strokeWidth={1}
              strokeDasharray="1"
              ifOverflow="extendDomain"
            />
          )}
          <Area {...quiet} type="monotone" dataKey="fillPos" baseValue={0} stroke="none" fill={`url(#${fp})`} />
          <Area {...quiet} type="monotone" dataKey="fillNeg" baseValue={0} stroke="none" fill={`url(#${fn})`} />
          <Area {...quiet} type="monotone" dataKey="value" stroke={stroke} strokeWidth={1.75} fill="none" />
          {showProjected && (
            <Area
              {...quiet}
              type="linear"
              dataKey="projected"
              stroke={stroke}
              strokeWidth={1}
              strokeDasharray="1"
              strokeOpacity={0.45}
              fill="none"
            />
          )}
        </AreaChart>
      </ChartContainer>
      <ChartContainer
        config={config}
        className={cn(
          "pointer-events-none absolute inset-0",
          shellClass,
          "cursor-default [&_.recharts-surface]:cursor-default"
        )}
      >
        <AreaChart data={rows} margin={chartMargin}>
          <XAxis type="number" dataKey="day" domain={[0, totalDays]} hide />
          <YAxis type="number" domain={domain} hide width={0} />
          <Customized
            component={(p: {
              xAxisMap?: Record<string, Axis>;
              yAxisMap?: Record<string, Axis>;
              width?: number;
              height?: number;
            }) => (
              <Overlay
                row={endRow}
                begin={begin}
                end={end}
                totalDays={totalDays}
                mono={mono}
                splitAt={splitAt}
                warnAbove={warnAbove}
                compact={compact}
                formatLabel={formatLabel}
                {...p}
              />
            )}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
