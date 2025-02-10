/*
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
