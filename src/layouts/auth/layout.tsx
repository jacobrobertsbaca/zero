import PropTypes from "prop-types";
import NextLink from "next/link";
import { Box, Stack, Typography } from "@mui/material";
import { Logo } from "src/components/logo";
import Head from "next/head";
import { withAuthGuard } from "src/components/with-auth-guard";

type LayoutProps = {
  name: string;
  children: React.ReactNode;
};

export const Layout = withAuthGuard(false, ({ children, name }: LayoutProps) => (
  <>
    <Head>
      <title>{name} | zero</title>
    </Head>
    <Box
      component="main"
      sx={{
        display: "flex",
        flex: "1 1 auto",
      }}
    >
      <Box
        component="header"
        sx={{
          left: 0,
          p: 3,
          position: "fixed",
          top: 0,
          width: "100%",
        }}
      >
        <Box
          component={NextLink}
          href="/"
          sx={{
            display: "inline-flex",
            height: 32,
            width: 32,
          }}
        >
          <Logo />
        </Box>
      </Box>
      <Box
        sx={{
          backgroundColor: "background.paper",
          flex: "1 1 auto",
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            maxWidth: 550,
            px: 3,
            py: "100px",
            width: "100%",
          }}
        >
          <div>
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Typography variant="h4">{name}</Typography>
            </Stack>
            {children}
          </div>
        </Box>
      </Box>
    </Box>
  </>
));
