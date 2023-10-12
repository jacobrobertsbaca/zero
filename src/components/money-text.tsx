import { Typography, TypographyProps } from "@mui/material";
import { moneyFormat } from "src/types/money/methods";
import { Money } from "src/types/money/types";

type MoneyTextProps = TypographyProps & {
  amount: Money;
  plus?: boolean;
};

export const MoneyText = ({ amount, plus, ...rest }: MoneyTextProps) => (
  <Typography
    variant="inherit"
    color={amount.amount >= 0 ? "success.light" : "warning.main"}
    {...rest}
  >
    &nbsp;{plus && amount.amount > 0 && "+"}{moneyFormat(amount, true)}&nbsp;
  </Typography>
);