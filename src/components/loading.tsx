import { CircularProgress, Unstable_Grid2 as Grid } from "@mui/material";

type LoadingProps<T> = {
  value: T;
  children: React.ReactNode | ((value: NonNullable<T>) => React.ReactNode);
};

export const Loading = <T,>({ value, children }: LoadingProps<T>) => {
  if (!value)
    return (
      <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: "80vh", height: 1, width: 1 }}
      >
        <Grid xs={3}>
          <CircularProgress color="primary" size={30} />
        </Grid>
      </Grid>
    );

  return <>{typeof children === "function" ? children(value) : children}</>;
};
