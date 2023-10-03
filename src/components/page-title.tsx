import { Stack, Typography } from "@mui/material";
import Head from "next/head";

export const PageTitle = ({ title }: { title: string }) => (
  <>
    <Head>
      <title>{title} | zero</title>
    </Head>
    <Stack spacing={3} sx={{ mb: 3 }}>
      <Typography variant="h4">{title}</Typography>
    </Stack>
  </>
);