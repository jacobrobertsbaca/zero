"use client";

import { useMemo } from "react";
import { BudgetTimeline } from "src/types/budget/types";
import { TimelineChart } from "../common/timeline-chart";
import { BudgetMetric, formatMetricLabel, metricValue, useBudgetMetric } from "./budget-grid";

export function BudgetTimelineChart({ timeline }: { timeline: BudgetTimeline }) {
  const metric = useBudgetMetric();
  const mono = metric !== BudgetMetric.Net;
  const { begin, end, points } = timeline;

  const series = useMemo(
    () => points.map((p) => ({ date: p.date, value: metricValue(p.net, p.amounts, metric) })),
    [points, metric]
  );

  return (
    <TimelineChart
      begin={begin}
      end={end}
      points={series}
      mono={mono}
      formatLabel={(value) => formatMetricLabel(value, metric)}
      resetKey={metric}
    />
  );
}
