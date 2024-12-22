import React, { useEffect } from "react";
import {
  StyledSnackbarContainer,
  StyledSnackbar,
  StyledMessage,
  StyledCloseButtonContainer
} from "./SnackBar.styles";
import Grow from "@mui/material/Grow";
import { SnackBarProps } from "./types";
import CloseIcon from "@mui/icons-material/Close";

export const Snackbar: React.FC<SnackBarProps> = ({
  message,
  open,
  onClose,
  position,
  autoHideDuration = 5000
}) => {
  useEffect(() => {
    if (open && autoHideDuration) {
      const timer = setTimeout(onClose, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, onClose]);

  return (
    <Grow in={open}>
      <StyledSnackbarContainer position={position}>
        <StyledSnackbar>
          <StyledMessage>{message}</StyledMessage>
          <StyledCloseButtonContainer onClick={onClose}>
            <CloseIcon htmlColor="#053204" />
          </StyledCloseButtonContainer>
        </StyledSnackbar>
      </StyledSnackbarContainer>
    </Grow>
  );
};
