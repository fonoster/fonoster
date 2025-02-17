import { useCallback, useState } from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

export interface ErrorType {
  code: string;
  details?: string;
}

export const useNotification = () => {
  const [open, setOpen] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ title: string; message: string }>({ title: '', message: '' });

  const handleClose = () => {
    setOpen(false);
  };

  const notifyError = useCallback((error: ErrorType) => {
    console.log(error);
    const { code, details } = error;
    if (!code) return;
    let title = code.replace(/_/g, ' ');
    let message = '';

    switch (code) {
      case 'ALREADY_EXISTS':
        message = "The resource you're trying to create already exists.";
        break;
      case 'NOT_FOUND':
        message = "The requested resource could not be found.";
        break;
      case 'PERMISSION_DENIED':
        message = "You don't have permission to perform this action. Please verify your credentials or contact support if needed.";
        break;
      case 'UNAUTHENTICATED':
        message = "You need to be authenticated to perform this action.";
        break;
      case 'INVALID_ARGUMENT':
        message = details || "One or more provided arguments are invalid.";
        break;
      case 'INTERNAL':
        message = "An internal server error occurred. Please try again later.";
        break;
      default:
        message = "An unexpected error occurred. Please try again.";
    }

    setErrorInfo({ title, message });
    setOpen(true);
  }, []);

  const NotificationComponent = () => (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert 
        onClose={handleClose} 
        severity="error" 
        variant="filled"
        sx={{ width: '100%', minWidth: '300px' }}
      >
        <AlertTitle>{errorInfo.title}</AlertTitle>
        {errorInfo.message}
      </Alert>
    </Snackbar>
  );

  return { notifyError, NotificationComponent };
};
