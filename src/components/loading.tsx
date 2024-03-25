import { Box, CircularProgress, Divider, Stack, Typography } from "@mui/material";

type LoadingPropsBase = {
  error?: any;
};

type LoadingPropsWithoutValue = {
  loading?: boolean;
  children?: React.ReactNode;
};

type LoadingPropsWithValue<T> = {
  value: T;
  children: (value: NonNullable<T>) => React.ReactNode;
};

export type LoadingProps<T = unknown> = LoadingPropsBase & (LoadingPropsWithoutValue | LoadingPropsWithValue<T>);

export const Loading = <T,>(props: LoadingProps<T>) => {
  const { error } = props;
  if (typeof props.children === "function") {
    const { value } = props as LoadingPropsWithValue<T>;
    if (value) return <>{props.children(value)}</>;
  } else {
    const { loading } = props as LoadingPropsWithoutValue;
    if (loading !== undefined && !loading) return <>{props.children}</>;
  }

  return (
    <Box>
      <Divider />
      <Stack direction="column" alignItems="center" justifyContent="center" sx={{ height: 50, my: 5 }}>
        {error ? (
          <Stack alignItems="center">
            <Typography variant="inherit">😱 Oops. An error occurred.</Typography>
            {error.message && <Typography variant="caption" color="text.secondary">{error.message}</Typography>}
          </Stack>
        ) : (
          <CircularProgress size={24} />
        )}
      </Stack>
      <Divider />
    </Box>
  );
};
