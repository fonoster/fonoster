import React from "react";
import { Avatar, IconButton, Box } from "@mui/material";
import { Tooltip } from "../../design-system/ui/tooltip/tooltip";
import { Icon } from "../../design-system/icons/icons";

export const Notifications: React.FC = () => {
  return (
    <Box display="flex" alignItems="center" gap={2}>
      {/* Avatar */}
      <Tooltip title="This feature is coming soon!">
        <IconButton
          sx={{
            backgroundColor: "brand.03",
            width: 32,
            height: 32,
            opacity: 0.8
          }}
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
            <Icon name="NotificationsActive" fontSize="inherit" />
          </Avatar>
        </IconButton>
      </Tooltip>
    </Box>
  );
};
