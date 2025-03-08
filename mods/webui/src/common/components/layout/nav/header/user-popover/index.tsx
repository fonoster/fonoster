"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Popover from "@mui/material/Popover";
import { Typography } from "@stories/typography/Typography";
import List from "@mui/material/List";
import MenuItem from "@mui/material/MenuItem";
import { useRouter } from "next/navigation";

import type { User } from "@/types/user";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";

export interface UserPopoverProps {
  anchorEl: null | Element;
  onClose?: () => void;
  open: boolean;
  user: User;
}

export function UserPopover({
  anchorEl,
  onClose,
  open
}: UserPopoverProps): React.JSX.Element {
  const router = useRouter();
  const { authentication } = useFonosterClient();

  const handleAccountSettings = (): void => {
    if (onClose) {
      onClose();
    }
    router.push('/personal/settings');
  };

  const handleSignOut = React.useCallback(
    async (): Promise<void> => {
      authentication.signOut();
    },
    [authentication]
  );
  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      onClose={onClose}
      open={Boolean(open)}
      slotProps={{
        paper: {
          sx: {
            width: "250px",
            mt: 1.5,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            overflow: 'visible',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: -8,
              right: 20,
              width: 16,
              height: 16,
              bgcolor: 'background.paper',
              transform: 'rotate(45deg)',
              zIndex: 0,
            },
          }
        }
      }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
    >
      <Box sx={{ p: 2, pb: 1.5 }}>
        <Typography variant="body-medium" fontWeight="600" sx={{ color: 'text.primary', mb: 1 }}>
          Account
        </Typography>
      </Box>
      <Divider />
      <List sx={{ p: 0.5 }}>
        <MenuItem onClick={handleAccountSettings} sx={{
          px: 2,
          py: 1.5,
          '&:hover': { bgcolor: 'action.hover' },
        }}>
          <Typography variant="body-medium" sx={{ color: 'text.primary' }}>
            Account Settings
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem
          component="div"
          onClick={handleSignOut}
        >
          <Typography variant="body-medium">
            Sign Out
          </Typography>
        </MenuItem>
      </List>
    </Popover>
  );
}
