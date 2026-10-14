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
      <Box
        gap="16px"
        display="flex"
        flexDirection="column"
        sx={{ maxHeight: "60vh", overflowY: "auto" }}
      >
        <Typography variant="body-small" color="base.03">
          Welcome to Fonoster ("Fonoster," "we," "our," or "us"). These Terms
          and Conditions ("Terms") govern your access to and use of our platform
          and related services (collectively, the "Services"). By accessing or
          using our Services, you agree to be bound by these Terms.
        </Typography>

        <Typography variant="heading-small">1. Eligibility</Typography>
        <Typography variant="body-small" color="base.03">
          You must be at least 18 years old to use our Services. By using the
          Services, you represent and warrant that you meet this requirement.
        </Typography>

        <Typography variant="heading-small">2. Services</Typography>
        <Typography variant="body-small" color="base.03">
          Fonoster provides a cloud-based programmable telecommunications
          platform that enables developers and businesses to build and manage
          voice and messaging applications. The Services include APIs, SDKs, CLI
          tools, telephony features, and paid subscription plans (Pro $25/month,
          Advanced/Enterprise tiers).
        </Typography>

        <Typography variant="heading-small">3. Accounts</Typography>
        <Typography variant="body-small" color="base.03">
          To access the Services, you must create an account. You agree to
          provide accurate information during registration, maintain the
          confidentiality of your credentials, and be fully responsible for all
          activities under your account.
        </Typography>

        <Typography variant="heading-small">
          4. Subscriptions and Billing
        </Typography>
        <Typography variant="body-small" color="base.03">
          • Pro Plan: $25 per month, billed automatically in U.S. dollars <br />
          • Advanced Plan: Pricing as agreed under separate agreements <br />•
          Subscription fees are non-refundable except where required by law{" "}
          <br />
          • You may cancel at any time via your account settings <br />
          • We may suspend or terminate your account for non-payment <br />
        </Typography>

        <Typography variant="heading-small">5. Acceptable Use</Typography>
        <Typography variant="body-small" color="base.03">
          You agree not to use the Services for unlawful, fraudulent, or abusive
          purposes (including spam, robocalling, or unsolicited communications),
          interfere with the security of the Services, or attempt to
          reverse-engineer or misuse the Services beyond their intended scope.
        </Typography>

        <Typography variant="heading-small">
          6. Intellectual Property
        </Typography>
        <Typography variant="body-small" color="base.03">
          All content, trademarks, logos, and software associated with Fonoster
          Services are owned by Fonoster or its licensors. You are granted a
          limited, non-exclusive, non-transferable right to use the Services for
          your internal business purposes.
        </Typography>

        <Typography variant="heading-small">7. Third-Party Services</Typography>
        <Typography variant="body-small" color="base.03">
          The Services may integrate with third-party providers (e.g., Google,
          speech recognition APIs). Fonoster is not responsible for the
          performance or reliability of third-party services.
        </Typography>

        <Typography variant="heading-small">
          8. Disclaimer of Warranties
        </Typography>
        <Typography variant="body-small" color="base.03">
          The Services are provided "as is" and "as available." Fonoster
          disclaims all warranties, whether express, implied, statutory, or
          otherwise, including merchantability, fitness for a particular
          purpose, and non-infringement.
        </Typography>

        <Typography variant="heading-small">
          9. Limitation of Liability
        </Typography>
        <Typography variant="body-small" color="base.03">
          To the maximum extent permitted by law, Fonoster shall not be liable
          for any indirect, incidental, special, or consequential damages.
          Fonoster's total liability for any claim shall not exceed the greater
          of (i) the amount paid by you in the 12 months prior to the claim or
          (ii) $100.
        </Typography>

        <Typography variant="heading-small">10. Indemnification</Typography>
        <Typography variant="body-small" color="base.03">
          You agree to indemnify and hold Fonoster, its affiliates, and their
          officers, directors, employees, and agents harmless from any claims,
          damages, liabilities, costs, or expenses arising out of your use of
          the Services or violation of these Terms.
        </Typography>

        <Typography variant="heading-small">11. Termination</Typography>
        <Typography variant="body-small" color="base.03">
          We may suspend or terminate your account or access to the Services at
          our discretion, including for violation of these Terms or non-payment.
          You may also terminate your account at any time by canceling your
          subscription.
        </Typography>

        <Typography variant="heading-small">12. Modifications</Typography>
        <Typography variant="body-small" color="base.03">
          We may update these Terms from time to time. Material changes will be
          communicated via our website or email. Continued use of the Services
          after updates constitutes acceptance of the revised Terms.
        </Typography>

        <Typography variant="heading-small">13. Governing Law</Typography>
        <Typography variant="body-small" color="base.03">
          These Terms shall be governed by and construed under the laws of the
          State of California, United States. Any disputes shall be resolved in
          the courts located in California, United States.
        </Typography>

        <Typography variant="heading-small">14. Contact Us</Typography>
        <Typography variant="body-small" color="base.03">
          For questions about these Terms or our Services, please contact us at
          team@fonoster.com or visit www.fonoster.com.
        </Typography>

        <Typography
          variant="body-small"
          color="base.03"
          sx={{ fontWeight: "bold", mt: 2 }}
        >
          By clicking "Agree", you confirm that you have read, understood, and
          agree to be bound by these Terms and Conditions.
        </Typography>
      </Box>
    </Modal>
  );
};
