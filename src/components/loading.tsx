import { Box, CircularProgress, Divider, Stack } from "@mui/material";

type LoadingProps<T> = {
  value: T;
  children: React.ReactNode | ((value: NonNullable<T>) => React.ReactNode);
};

export const Loading = <T,>({ value, children }: LoadingProps<T>) => {
  if (!value)
    return (
      <Box>
        <Divider />
        <Stack
          direction="column"
          alignItems="center"
          justifyContent="center"
          sx={{ height: 50, my: 5 }}
        >
          <CircularProgress size={24} />
        </Stack>
        <Divider />
      </Box>
    );

  return <>{typeof children === "function" ? children(value) : children}</>;
};
