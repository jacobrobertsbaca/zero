import { Typography, TypographyProps } from "@mui/material";
import { moneyFormat, MoneyFormatOptions, RoundingMode } from "src/types/money/methods";
import { Money } from "src/types/money/types";

type MoneyTextProps = TypographyProps & MoneyFormatOptions & {
  /**
   * The amount associated with this text
   */
  amount: Money;

  /**
   * Whether or not to color the text depending on positive/negative.
   */
  status?: boolean;
};

export const MoneyText = ({ amount, status, ...rest }: MoneyTextProps) => (
  <Typography
    variant="inherit"
    display="inline"
    {...(status ? { color: amount.amount >= 0 ? "success.light" : "warning.main" } : {})}
    {...rest}
  >
    {moneyFormat(amount, rest)}
  </Typography>
);