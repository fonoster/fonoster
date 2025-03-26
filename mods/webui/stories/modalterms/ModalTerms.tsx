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
import { Modal, Box, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  StyledModalTerms,
  StyledTitleContainer,
  StyledCloseButtonContainer,
  StyledTitle
} from "./ModalTerms.styles";
import { TermsProps } from "./types";
import { Typography } from "../typography/Typography";

export const ModalTerms: React.FC<TermsProps> = ({
  title = "Terms and Conditions",
  message,
  open,
  onClose
}) => {
  const theme = useTheme();

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: `${theme.palette.primary.main}1A`
          }
        }
      }}
    >
      <Box sx={StyledModalTerms}>
        <StyledTitleContainer sx={StyledTitle}>
          <Typography variant="body-large">{title}</Typography>
          <StyledCloseButtonContainer onClick={onClose}>
            <CloseIcon htmlColor="#333333" />
          </StyledCloseButtonContainer>
        </StyledTitleContainer>

        {message ? (
          <Typography
            variant="body-medium"
            dangerouslySetInnerHTML={{ __html: message }}
          />
        ) : (
          <>
            <Typography variant="body-medium" marginBottom="1rem">
              Welcome to Fonoster! These Terms and Conditions govern your use of
              our services.
            </Typography>
            <Typography variant="heading-small">
              1. Acceptance of Terms
            </Typography>
            <Typography variant="body-medium" marginBottom="1rem">
              By accessing and using our services, you agree to be bound by
              these terms.
            </Typography>
            <Typography variant="heading-small">2. Privacy Policy</Typography>
            <Typography variant="body-medium" marginBottom="1rem">
              Your privacy is important to us. Please review our Privacy Policy
              to understand how we collect and use your information.
            </Typography>
            <Typography variant="heading-small">
              3. User Responsibilities
            </Typography>
            <Typography variant="body-medium" marginBottom="1rem">
              You are responsible for maintaining the security of your account
              and any activities that occur under your account.
            </Typography>

            <Typography variant="heading-small">4. Service Usage</Typography>
            <Typography variant="body-medium" marginBottom="1rem">
              Our services are provided "as is" and we make no warranties about
              their availability or functionality.
            </Typography>

            <Typography variant="heading-small">
              5. Intellectual Property
            </Typography>
            <Typography variant="body-medium" marginBottom="1rem">
              All content and materials available through our services are
              protected by intellectual property rights.
            </Typography>

            <Typography variant="heading-small">6. Termination</Typography>
            <Typography variant="body-medium" marginBottom="1rem">
              We reserve the right to terminate or suspend access to our
              services at our discretion.
            </Typography>

            <Typography variant="heading-small">7. Changes to Terms</Typography>
            <Typography variant="body-medium" marginBottom="1rem">
              We may modify these terms at any time. Continued use of our
              services constitutes acceptance of any changes.
            </Typography>

            <Typography variant="body-medium" marginBottom="1rem">
              By clicking "Agree", you confirm that you have read and agree to
              these terms.
            </Typography>
          </>
        )}
      </Box>
    </Modal>
  );
};
