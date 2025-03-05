"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";

import type { User } from "@/types/user";
import { CustomSignOut } from "./custom-sign-out";

export interface UserPopoverProps {
  anchorEl: null | Element;
  onClose?: () => void;
  open: boolean;
  user: User;
}

export function UserPopover({
  anchorEl,
  onClose,
  open,
  user
}: UserPopoverProps): React.JSX.Element {
  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      onClose={onClose}
      open={Boolean(open)}
      slotProps={{ paper: { sx: { width: "280px" } } }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
    >
      <Box sx={{ p: 2 }}>
        <Typography>{user.name}</Typography>
        <Typography color="text.secondary" variant="body2">
          {user.email}
        </Typography>
      </Box>
      <Divider />
      {/* <List sx={{ p: 1 }}>
        <MenuItem component={RouterLink} href={paths.dashboard.settings.account} onClick={onClose}>
          <ListItemIcon>
            <UserIcon />
          </ListItemIcon>
          Cuenta
        </MenuItem>
        <MenuItem component={RouterLink} href={paths.dashboard.settings.security} onClick={onClose}>
          <ListItemIcon>
            <LockKeyIcon />
          </ListItemIcon>
          Seguridad
        </MenuItem>
      </List> */}
      <Divider />
      <Box sx={{ p: 1 }}>
        <CustomSignOut />
      </Box>
    </Popover>
  );
}
