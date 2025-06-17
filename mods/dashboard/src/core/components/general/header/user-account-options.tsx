/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useCallback, useState } from "react";
import { Menu, MenuItem, Box, ListItemText } from "@mui/material";
import { useNavigate } from "react-router";
import { useAuth } from "~/auth/hooks/use-auth";
import { Typography } from "../../design-system/ui/typography/typography";
import { HeaderIconButton } from "./header-icon-button";
import { getInitials } from "./header-random-avatar.helper";

export const UserAccountPopover: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget),
    []
  );

  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleNavigate = (path: string) => {
    handleClose();
    navigate(path);
  };

  return (
    <Box display="flex" alignItems="center" gap={2}>
      <HeaderIconButton
        initials={getInitials(user.name)}
        avatar={user.avatar}
        onClick={handleOpen}
      />

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              padding: 0,
              minWidth: 232,
              mt: 1.5,
              borderRadius: 0,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)"
            }
          }
        }}
      >
        <Box sx={{ p: "10px", display: "flex", alignItems: "center" }}>
          <Typography variant="body-medium">Account</Typography>
        </Box>

        <MenuItem
          sx={{ padding: "10px !important" }}
          onClick={() => handleNavigate("/accounts/profile")}
        >
          <ListItemText
            primary={
              <Typography variant="body-small">Account Settings</Typography>
            }
          />
        </MenuItem>

        <MenuItem
          sx={{ padding: "10px !important" }}
          onClick={() => handleNavigate("/auth/logout?auto_logout=true")}
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
