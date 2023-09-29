import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { useCallback } from "react";
import { InfoTooltip } from "src/components/info-tooltip";
import { ActualNominal } from "src/types/budget/types";
import { moneyFactor, moneyFormat, moneySub } from "src/types/money/methods";

type SpendingBarProps = ActualNominal & {
  remaining?: boolean
};

export const SpendingBar = ({ actual, nominal, remaining }: SpendingBarProps) => {

  const getValue = useCallback(() => {
    if (nominal.amount === 0) return actual.amount >= 0 ? 100 : 0;
    if ((nominal.amount < 0 && actual.amount < 0) || (nominal.amount > 0 && actual.amount > 0))
      return Math.min(100, 100 * actual.amount / nominal.amount);
    return 0;
  }, [actual, nominal]);

  const delta = moneySub(nominal, actual);

  return (
    <Box>
      <LinearProgress
        variant="determinate"
        value={getValue()}
      />
      <Box
        sx={{
          mt: 0.5,
          display: "flex",
          justifyContent: "space-between"
        }}
      >
        <Typography variant="caption">
          <Typography display="inline" variant="inherit" fontWeight={700}>
            {moneyFormat(actual, true)}
          </Typography> of {moneyFormat(nominal, true)}
        </Typography>
        {remaining &&
          <Typography variant="caption">
            <Typography display="inline" variant="inherit" fontWeight={700}>
              {moneyFormat(delta.amount >= 0 ? delta : moneyFactor(delta, -1), true)}
            </Typography> {delta.amount >= 0 ? "left" : "over"}
          </Typography>
        }
      </Box>
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
        { typeof props.title === "string"
          ? <Typography variant="subtitle1" color="text.secondary">
            {props.title}
          </Typography>
          : props.title
        }
        {props.tooltip && <InfoTooltip title={props.tooltip} />}
      </Stack>
      { typeof props.subtitle === "string"
        ? <Typography variant="subtitle2" color="text.secondary">
          {props.subtitle}
        </Typography>
        : props.subtitle
      }
    </Stack>
    <SpendingBar {...props} />
  </Box>
);