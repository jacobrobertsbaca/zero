import { Box, Divider, IconButton, Stack, SvgIcon, Typography } from "@mui/material";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";

type SidebarHeaderProps = {
  onClose: () => void;
  children: React.ReactNode;
};

export const SidebarHeader = ({ onClose, children }: SidebarHeaderProps) => (
  <Box>
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 2 }}>
      <Typography variant="subtitle1" sx={{ ml: 1 }}>
        {children}
      </Typography>
      <IconButton onClick={onClose}>
        <SvgIcon>
          <XMarkIcon />
        </SvgIcon>
      </IconButton>
    </Stack>

    <Divider />
  </Box>
);
