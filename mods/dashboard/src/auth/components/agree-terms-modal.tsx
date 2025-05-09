/**
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
import { Box } from "@mui/material";
import { Modal } from "~/core/components/design-system/ui/modal/modal";
import { Typography } from "~/core/components/design-system/ui/typography/typography";

export interface AgreeTermsModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const AgreeTermsModal = ({
  isOpen,
  setIsOpen
}: AgreeTermsModalProps) => {
  return (
    <Modal
      open={isOpen}
      onClose={() => setIsOpen(false)}
      title="Terms and Conditions"
    >
      <Box gap="16px" display="flex" flexDirection="column">
        <Typography variant="body-small" color="base.03">
          Welcome to Fonoster! These Terms and Conditions govern your use of our
          services.
        </Typography>
        <Typography variant="heading-small">1. Acceptance of Terms</Typography>
        <Typography variant="body-small" color="base.03">
          By accessing and using our services, you agree to be bound by these
          terms.
        </Typography>
        <Typography variant="heading-small">2. Privacy Policy</Typography>
        <Typography variant="body-small" color="base.03">
          Your privacy is important to us. Please review our Privacy Policy to
          understand how we collect and use your information.
        </Typography>
        <Typography variant="heading-small">
          3. User Responsibilities
        </Typography>
        <Typography variant="body-small" color="base.03">
          You are responsible for maintaining the security of your account and
          any activities that occur under your account.
        </Typography>

        <Typography variant="heading-small">4. Service Usage</Typography>
        <Typography variant="body-small" color="base.03">
          Our services are provided "as is" and we make no warranties about
          their availability or functionality.
        </Typography>

        <Typography variant="heading-small">
          5. Intellectual Property
        </Typography>
        <Typography variant="body-small" color="base.03">
          All content and materials available through our services are protected
          by intellectual property rights.
        </Typography>

        <Typography variant="heading-small">6. Termination</Typography>
        <Typography variant="body-small" color="base.03">
          We reserve the right to terminate or suspend access to our services at
          our discretion.
        </Typography>

        <Typography variant="heading-small">7. Changes to Terms</Typography>
        <Typography variant="body-small" color="base.03">
          We may modify these terms at any time. Continued use of our services
          constitutes acceptance of any changes.
        </Typography>

        <Typography variant="body-small" color="base.03">
          By clicking "Agree", you confirm that you have read and agree to these
          terms.
        </Typography>
      </Box>
    </Modal>
  );
};
