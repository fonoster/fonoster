import { useCallback, useState } from "react";
import {
  Snackbar as MuiSnackbar,
  Alert,
  AlertTitle,
  IconButton,
  Typography,
  SnackbarOrigin
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CustomSnackbarWrapper from "@/common/components/CustomSnackbarWrapper";

export interface ErrorType {
  code: string | number;
  details?: string;
  message: string;
}

export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationOptions {
  title?: string;
  message: string;
  type?: NotificationType;
  duration?: number;
  position?: SnackbarOrigin;
  showIcon?: boolean;
  autoHide?: boolean;
  customStyle?: {
    backgroundColor?: string;
    color?: string;
  };
  onClose?: () => void;
  showCountdown?: boolean;
  countdownDuration?: number;
  useCustomSnackbar?: boolean;
}

export const useNotification = () => {
  const [open, setOpen] = useState(false);
  const [notificationInfo, setNotificationInfo] = useState<NotificationOptions>(
    {
      title: "",
      message: "",
      type: "error",
      duration: 6000,
      position: { vertical: "top", horizontal: "center" },
      showIcon: true,
      autoHide: true,
      customStyle: undefined,
      showCountdown: false,
      countdownDuration: 0,
      useCustomSnackbar: true
    }
  );
  const [countdown, setCountdown] = useState(0);

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway" && notificationInfo.autoHide === false) {
      return;
    }
    setOpen(false);
    if (notificationInfo.onClose) {
      notificationInfo.onClose();
    }
  };

  const notifyError = useCallback((error: ErrorType) => {
    const { code, details, message: errorMessage } = error;
    if (!code) return;

    if (Number(code)) {
      notify({
        title: "Error",
        message: errorMessage,
        type: "error",
        useCustomSnackbar: true
      });
    } else {
      let title = (code as string).replace(/_/g, " ");
      let message = "";

      switch (code) {
        case "ALREADY_EXISTS":
          message = "The resource you're trying to create already exists.";
          break;
        case "NOT_FOUND":
          message = "The requested resource could not be found.";
          break;
        case "PERMISSION_DENIED":
          message =
            "You don't have permission to perform this action. Please verify your credentials or contact support if needed.";
          break;
        case "UNAUTHENTICATED":
          message = "You need to be authenticated to perform this action.";
          break;
        case "RESET_PASSWORD_ERROR":
          message =
            "Failed to reset password. Please try again or request a new reset link.";
          break;
        case "INVALID_ARGUMENT":
          message = details || "One or more provided arguments are invalid.";
          break;
        case "INTERNAL":
          message =
            "An internal server error occurred. Please try again later.";
          break;
        default:
          message = "An unexpected error occurred. Please try again.";
      }

      notify({
        title,
        message,
        type: "error",
        useCustomSnackbar: true
      });
    }
  }, []);

  const notify = useCallback(
    (options: NotificationOptions) => {
      const mergedOptions = {
        ...notificationInfo,
        ...options
      };

      setNotificationInfo(mergedOptions);
      setOpen(true);

      if (mergedOptions.showCountdown && mergedOptions.countdownDuration) {
        setCountdown(mergedOptions.countdownDuration);

        const countdownInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(countdownInterval);
      }
    },
    [notificationInfo]
  );

  const notifySuccess = useCallback(
    (message: string, options?: Partial<NotificationOptions>) => {
      notify({
        message,
        type: "success",
        useCustomSnackbar: true,
        position: { vertical: "top", horizontal: "center" },
        ...options
      });
    },
    [notify]
  );

  const notifyWarning = useCallback(
    (message: string, options?: Partial<NotificationOptions>) => {
      notify({
        message,
        type: "warning",
        useCustomSnackbar: true,
        position: { vertical: "top", horizontal: "center" },
        ...options
      });
    },
    [notify]
  );

  const notifyInfo = useCallback(
    (message: string, options?: Partial<NotificationOptions>) => {
      notify({
        message,
        type: "info",
        useCustomSnackbar: true,
        position: { vertical: "top", horizontal: "center" },
        ...options
      });
    },
    [notify]
  );

  const notifySuccessWithStyle = useCallback(
    (message: string, options?: Partial<NotificationOptions>) => {
      notify({
        message,
        type: "success",
        useCustomSnackbar: true,
        position: { vertical: "top", horizontal: "center" },
        autoHide: false,
        ...options
      });
    },
    [notify]
  );

  const NotificationComponent = () => {
    if (!open) return null;

    let alertStyle = {};
    if (notificationInfo.customStyle) {
      alertStyle = {
        backgroundColor: notificationInfo.customStyle.backgroundColor,
        color: notificationInfo.customStyle.color,
        width: "100%",
        "& .MuiAlert-icon": {
          color: notificationInfo.customStyle.color
        }
      };
    }

    if (notificationInfo.useCustomSnackbar) {
      const position =
        notificationInfo.position?.vertical === "top"
          ? notificationInfo.position?.horizontal === "center"
            ? "top-center"
            : notificationInfo.position?.horizontal === "right"
              ? "top-right"
              : "top-left"
          : notificationInfo.position?.horizontal === "center"
            ? "bottom-center"
            : notificationInfo.position?.horizontal === "right"
              ? "bottom-right"
              : "bottom-left";

      return (
        <CustomSnackbarWrapper
          open={open}
          message={notificationInfo.message}
          onClose={handleClose}
          position={position}
          autoHideDuration={
            notificationInfo.autoHide ? notificationInfo.duration || 5000 : 5000
          }
          type={notificationInfo.type}
        />
      );
    }

    return (
      <MuiSnackbar
        open={open}
        autoHideDuration={
          notificationInfo.autoHide ? notificationInfo.duration : null
        }
        onClose={handleClose}
        anchorOrigin={notificationInfo.position}
        sx={{
          ...(notificationInfo.position?.vertical === "top" && { top: "20px" }),
          "& .MuiPaper-root": {
            width: "100%",
            maxWidth: "600px",
            ...(notificationInfo.customStyle && {
              backgroundColor: notificationInfo.customStyle.backgroundColor,
              color: notificationInfo.customStyle.color,
              padding: "6px 16px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            })
          }
        }}
      >
        <Alert
          onClose={notificationInfo.autoHide ? handleClose : undefined}
          severity={notificationInfo.type}
          variant={notificationInfo.customStyle ? "standard" : "filled"}
          sx={{
            width: "100%",
            minWidth: "300px",
            ...alertStyle
          }}
          action={
            !notificationInfo.autoHide && (
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleClose}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )
          }
        >
          {notificationInfo.title && (
            <AlertTitle>{notificationInfo.title}</AlertTitle>
          )}
          <Typography variant="body1">{notificationInfo.message}</Typography>
          {notificationInfo.showCountdown && countdown > 0 && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {countdown > 0 &&
                `You will be redirected in ${countdown} second${countdown !== 1 ? "s" : ""}.`}
            </Typography>
          )}
        </Alert>
      </MuiSnackbar>
    );
  };

  return {
    notifyError,
    notify,
    notifySuccess,
    notifyWarning,
    notifyInfo,
    notifySuccessWithStyle,
    NotificationComponent
  };
};
