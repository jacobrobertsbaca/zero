"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";
import { PageTitle } from "src/components/page-title";
import { Button } from "src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu";
import { CategoryType } from "src/types/category/types";
import { BudgetTimelineAmounts } from "src/types/budget/types";
import { moneyAbs, moneyFormat, defaultCurrency, RoundingMode } from "src/types/money/methods";

export enum BudgetMetric {
  Net = "net",
  Income = "income",
  Spending = "spending",
}

const OPTIONS = [
  { value: BudgetMetric.Net, label: "Net" },
  { value: BudgetMetric.Income, label: "Income" },
  { value: BudgetMetric.Spending, label: "Spending" },
] as const;

const MetricCtx = createContext(BudgetMetric.Net);
export const useBudgetMetric = () => useContext(MetricCtx);

export function metricValue(net: number, amounts: BudgetTimelineAmounts, metric: BudgetMetric) {
  if (metric === BudgetMetric.Income) return amounts[CategoryType.Income] ?? 0;
  if (metric === BudgetMetric.Spending) return amounts[CategoryType.Spending] ?? 0;
  return net;
}

export function formatMetricLabel(value: number, metric: BudgetMetric) {
  const round = { round: RoundingMode.RoundZero };
  if (metric === BudgetMetric.Net) {
    const amount = moneyFormat(moneyAbs({ amount: value, currency: defaultCurrency }), round);
    return value >= 0 ? `${amount} up` : `${amount} down`;
  }
  const amount = moneyFormat({ amount: value, currency: defaultCurrency }, round);
  return metric === BudgetMetric.Income ? `${amount} earned` : `${amount} spent`;
}

export function BudgetGrid({
  children,
  actions,
  dropdown = true,
  loading = false,
}: {
  children?: ReactNode;
  actions?: ReactNode;
  dropdown?: boolean;
  loading?: boolean;
}) {
  const [metric, setMetric] = useState(BudgetMetric.Net);
  const [open, setOpen] = useState(false);

  return (
    <MetricCtx.Provider value={metric}>
      <div className="flex flex-col gap-2">
        <div className="mb-3 flex items-center gap-1">
          <PageTitle title="Budgets" className={loading ? "text-shimmer" : undefined} />
          {actions}
          {dropdown && (
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-auto gap-1 px-1.5 py-0 text-sm font-medium text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground data-[state=open]:bg-transparent"
                >
                  {OPTIONS.find((o) => o.value === metric)?.label}
                  {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {OPTIONS.map((o) => (
                  <DropdownMenuItem
                    key={o.value}
                    onClick={() => setMetric(o.value)}
                    className={o.value === metric ? "bg-accent" : undefined}
                  >
                    {o.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="grid animate-in fade-in grid-cols-1 gap-4 duration-300 sm:grid-cols-2 md:grid-cols-3">
          {children}
        </div>
      </div>
    </MetricCtx.Provider>
  );
}
