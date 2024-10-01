import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NextLink from "next/link";

export const Logo = () => {
  return (
    <Typography color="primary" variant="h6">
      zero
    </Typography>
  );
};

export const LogoLink = () => {
  return (
    <Box
      component={NextLink}
      href="/"
      sx={{
        display: "inline-flex",
        height: 32,
        width: 32,
        textDecoration: "none"
      }}
    >
      <Logo />
    </Box>
  );
};
