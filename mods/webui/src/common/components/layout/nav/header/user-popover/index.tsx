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
import { NavigationDropdownAccount } from "@stories/navigationdropdownaccount/NavigationDropdownAccount";

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
    router.push("/personal/settings");
  };

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    authentication.signOut();
  }, [authentication]);
  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      onClose={onClose}
      open={Boolean(open)}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      PaperProps={{
        sx: {
          width: "251px",
          p: 0,
          mt: 3,
          boxShadow: "0px 5px 10px 0px #0000001A"
        }
      }}
    >
      <Box>
        <NavigationDropdownAccount
          onAccountSettingsClicked={handleAccountSettings}
          onSignoutClicked={handleSignOut}
        />
      </Box>
    </Popover>
  );
}
