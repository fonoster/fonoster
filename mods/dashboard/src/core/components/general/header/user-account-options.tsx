import React, { useCallback, useState } from "react";
import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Box,
  ListItemText
} from "@mui/material";
import { useNavigate } from "react-router";
import { useAuth } from "~/auth/hooks/use-auth";
import { getAvatar } from "./header-random-avatar.helper";
import { Typography } from "../../design-system/ui/typography/typography";

export const UserAccountPopover: React.FC = () => {
  /** Get the current user and their workspaces from the auth context. */
  const { user } = useAuth();

  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => setAnchorEl(null), []);

  return (
    <Box display="flex" alignItems="center" gap={2}>
      {/* Avatar */}
      <IconButton
        onClick={handleClick}
        sx={{ backgroundColor: "brand.03", width: 32, height: 32 }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            fontSize: 13,
            bgcolor: "brand.03",
            color: "brand.07"
          }}
        >
          {getAvatar(user.name)}
        </Avatar>
      </IconButton>

      {/* Popover */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              width: 240,
              mt: 1.5,
              borderRadius: 2,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)"
            }
          }
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box px={2} py={1}>
          <Typography variant="body-medium">Account</Typography>
        </Box>

        <MenuItem
          onClick={() => {
            handleClose();
            navigate("/accounts/profile");
          }}
        >
          <ListItemText
            primary={
              <Typography variant="body-small">Account Settings</Typography>
            }
          />
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleClose();
            navigate("/auth/logout?auto_logout=true");
          }}
        >
          <ListItemText
            primary={
              <Typography variant="body-small-underline">Sign Out</Typography>
            }
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};
