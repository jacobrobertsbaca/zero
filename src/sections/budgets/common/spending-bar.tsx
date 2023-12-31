import { Box, LinearProgress, Stack, Typography, linearProgressClasses } from "@mui/material";
import { useCallback } from "react";
import { InfoTooltip } from "src/components/info-tooltip";
import { MoneyText } from "src/components/money-text";
import { ActualNominal } from "src/types/budget/types";
import { moneyAbs, moneyFactor, moneySub, RoundingMode } from "src/types/money/methods";

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
      <Typography variant="caption">
        <MoneyText variant="inherit" amount={amount} round={RoundingMode.RoundZero} fontWeight={700} />
        &nbsp;
        {suffix}
      </Typography>
    );
  }, [actual, nominal]);

  const shouldWarn = (() => {
    if (nominal.amount >= 0) return actual.amount - nominal.amount > 0;
    return actual.amount - nominal.amount < 0;
  })();

  return (
    <Box>
      <LinearProgress
        variant="determinate"
        value={getValue()}
        sx={{
          [`& .${linearProgressClasses.barColorPrimary}`]: {
            backgroundColor: warn && shouldWarn ? (theme) => theme.palette.error.main : undefined,
          },
        }}
      />
      <Stack direction="row" flexWrap="wrap" mt={0.5} justifyContent="space-between">
        <Typography variant="caption">
          <MoneyText variant="inherit" fontWeight={700} amount={actual} round={RoundingMode.RoundZero} /> of&nbsp;
          <MoneyText variant="inherit" amount={nominal} round={RoundingMode.RoundZero} />
        </Typography>
        {remaining && (typeof remaining === "boolean" ? getRemaining() : remaining)}
      </Stack>
    </Box>
  );
};

type TitledSpendingBarProps = SpendingBarProps & {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  tooltip?: React.ReactNode;
};

export const TitledSpendingBar = (props: TitledSpendingBarProps) => (
  <Box>
    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
      <Stack direction="row" alignItems="center" spacing={0.25}>
        <Typography variant="subtitle1" color="text.secondary">
          {props.title}
        </Typography>
        {props.tooltip && <InfoTooltip title={props.tooltip} />}
      </Stack>
      <Typography variant="subtitle2" color="text.secondary">
        {props.subtitle}
      </Typography>
    </Stack>
    <SpendingBar {...props} />
  </Box>
);
