import { CircularProgress, Stack } from "@mui/material";

type LoadingProps<T> = {
  value: T;
  children: React.ReactNode | ((value: NonNullable<T>) => React.ReactNode);
};

export const Loading = <T,>({ value, children }: LoadingProps<T>) => {
  if (!value)
    return (
      <Stack
        direction="column"
        alignItems="center"
        justifyContent="center"
        sx={{ height: 50 }}
      >
        <CircularProgress color="primary" size={30} />
      </Stack>
    );

  return <>{typeof children === "function" ? children(value) : children}</>;
};
