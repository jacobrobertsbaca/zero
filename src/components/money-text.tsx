import { moneyFormat, MoneyFormatOptions } from "src/types/money/methods";
import { Money } from "src/types/money/types";
import { cn } from "src/lib/utils";

type MoneyTextProps = MoneyFormatOptions & {
  amount: Money;
  status?: boolean;
  className?: string;
};

export const MoneyText = ({ amount, status, className, ...rest }: MoneyTextProps) => (
  <span
    className={cn(
      "inline",
      status && (amount.amount >= 0 ? "text-success" : "text-warning"),
      className
    )}
  >
    {moneyFormat(amount, rest)}
  </span>
);
