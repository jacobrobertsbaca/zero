import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import { usePathname } from "next/navigation";
import { styled } from "@mui/material/styles";
import { withAuthGuard } from "src/components/with-auth-guard";
import { SideNav } from "./side-nav";
import { TopNav } from "./top-nav";

const SIDE_NAV_WIDTH = 280;

const LayoutRoot = styled("div")(({ theme }) => ({
  display: "flex",
  flex: "1 1 auto",
  maxWidth: "100%",
  [theme.breakpoints.up("lg")]: {
    paddingLeft: SIDE_NAV_WIDTH,
  },
}));

const LayoutContainer = styled("div")({
  display: "flex",
  flex: "1 1 auto",
  flexDirection: "column",
  width: "100%",
});

export const Layout = withAuthGuard(true, (props) => {
  const { children, name } = props;
  const pathname = usePathname();
  const [openNav, setOpenNav] = useState(false);

  const handlePathnameChange = useCallback(() => {
    if (openNav) {
      setOpenNav(false);
    }
  }, [openNav]);

  useEffect(
    () => {
      handlePathnameChange();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname]
  );

  return (
    <>
      <Head>
        <title>{name} | zero</title>
      </Head>
      <TopNav onNavOpen={() => setOpenNav(true)} />
      <SideNav onClose={() => setOpenNav(false)} open={openNav} />
      <LayoutRoot>
        <LayoutContainer>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              py: 8,
            }}
          >
            <Container maxWidth="lg">
              <Stack spacing={3}>
                <Typography variant="h4">{name}</Typography>
              </Stack>
              {children}
            </Container>
          </Box>
        </LayoutContainer>
      </LayoutRoot>
    </>
  );
});
