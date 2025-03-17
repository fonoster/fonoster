import React from "react";
import { Snackbar } from "@stories/snackbar/SnackBar";
import { useTheme } from "@mui/material/styles";

type NotificationType = "success" | "error" | "warning" | "info";

interface CustomSnackbarWrapperProps {
  open: boolean;
  message: string;
  onClose: () => void;
  position:
    | "top-center"
    | "top-right"
    | "top-left"
    | "bottom-center"
    | "bottom-right"
    | "bottom-left";
  autoHideDuration?: number;
  type?: NotificationType;
}

const CustomSnackbarWrapper: React.FC<CustomSnackbarWrapperProps> = ({
  open,
  message,
  onClose,
  position,
  autoHideDuration,
  type = "success"
}) => {
  const theme = useTheme();

  if (!open) return null;

  const notificationColors = {
    success: {
      backgroundColor: theme.palette.notification.success.background,
      color: theme.palette.notification.success.text
    },
    error: {
      backgroundColor: theme.palette.notification.error.background,
      color: theme.palette.notification.error.text
    },
    warning: {
      backgroundColor: theme.palette.notification.warning.background,
      color: theme.palette.notification.warning.text
    },
    info: {
      backgroundColor: theme.palette.notification.info.background,
      color: theme.palette.notification.info.text
    }
  };

  const currentStyle = notificationColors[type];

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 1400,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        display: "flex",
        justifyContent: "center"
      }}
    >
      <div
        style={
          {
            pointerEvents: "auto",
            "--background-color": currentStyle.backgroundColor,
            "--text-color": currentStyle.color
          } as React.CSSProperties
        }
      >
        <Snackbar
          open={open}
          message={message}
          onClose={onClose}
          position={position}
          autoHideDuration={autoHideDuration || 5000}
        />
      </div>
    </div>
  );
};

export default CustomSnackbarWrapper;
