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

import React from "react";
import { Modal, Typography, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  StyledTerms,
  StyledTitleContainer,
  StyledTitle,
  StyledMessage,
  StyledCloseButtonContainer
} from "./Terms.styles";
import { TermsProps } from "./types";

export const Terms: React.FC<TermsProps> = ({
  title = "Terms and Conditions",
  message,
  open,
  onClose
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{ outline: "none" }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(230, 255, 245, 0.75)"
          }
        }
      }}
    >
      <Box sx={StyledTerms}>
        <StyledTitleContainer>
          <Typography id="modal-modal-title" sx={StyledTitle}>
            {title}
          </Typography>
          <StyledCloseButtonContainer onClick={onClose}>
            <CloseIcon htmlColor="#333333" />
          </StyledCloseButtonContainer>
        </StyledTitleContainer>
        <Typography id="modal-modal-description" sx={StyledMessage}>
          {message}
        </Typography>
      </Box>
    </Modal>
  );
};
