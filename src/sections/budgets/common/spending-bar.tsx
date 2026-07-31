import { useCallback } from "react";
import { InfoTooltip } from "src/components/info-tooltip";
import { MoneyText } from "src/components/money-text";
import { ActualNominal } from "src/types/budget/types";
import { moneyAbs, moneyFactor, moneySub, RoundingMode } from "src/types/money/methods";
import { cn } from "src/lib/utils";

type SpendingBarProps = ActualNominal & {
  remaining?: boolean | React.ReactNode;
  warn?: boolean;
};

export const SpendingBar = ({ actual, nominal, remaining, warn }: SpendingBarProps) => {
  const getValue = useCallback(() => {
    if (nominal.amount === 0) return actual.amount > 0 ? 100 : 0;
    if ((nominal.amount < 0 && actual.amount < 0) || (nominal.amount > 0 && actual.amount > 0))
      return Math.min(100, (100 * actual.amount) / nominal.amount);
    return 0;
  }, [actual, nominal]);

  const getRemaining = useCallback(() => {
    const delta = moneySub(nominal, actual);
    const suffix = (() => {
      if (nominal.amount >= 0) {
        return delta.amount >= 0 ? "left" : "over";
      } else {
        return delta.amount >= 0 ? "over" : "left";
      }
    })();

    const amount = (() => {
      if (nominal.amount >= 0) {
        return moneyAbs(delta);
      } else {
        return moneyFactor(moneyAbs(delta), -1);
      }
    })();

    return (
      <span className="text-xs text-muted-foreground">
        <MoneyText amount={amount} round={RoundingMode.RoundZero} className="font-bold" />
        &nbsp;
        {suffix}
      </span>
    );
  }, [actual, nominal]);

  const shouldWarn = (() => {
    if (nominal.amount >= 0) return actual.amount - nominal.amount > 0;
    return actual.amount - nominal.amount < 0;
  })();

  const value = getValue();

  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
        <div
          className={cn("h-full rounded-full transition-all", warn && shouldWarn ? "bg-destructive" : "bg-primary")}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2">
        <span className="text-xs text-muted-foreground">
          <MoneyText className="font-bold" amount={actual} round={RoundingMode.RoundZero} />
          &nbsp;of&nbsp;
          <MoneyText amount={nominal} round={RoundingMode.RoundZero} />
        </span>
        {remaining && (typeof remaining === "boolean" ? getRemaining() : remaining)}
      </div>
    </div>
  );
};

type TitledSpendingBarProps = SpendingBarProps & {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  tooltip?: React.ReactNode;
};

export const TitledSpendingBar = (props: TitledSpendingBarProps) => (
  <div>
    <div className="mb-0.5 flex items-center justify-between">
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">{props.title}</span>
        {props.tooltip && <InfoTooltip title={props.tooltip} />}
      </div>
      <span className="text-sm text-muted-foreground">{props.subtitle}</span>
    </div>
    <SpendingBar {...props} />
  </div>
);
