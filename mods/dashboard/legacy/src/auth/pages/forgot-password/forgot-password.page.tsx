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
import {
  ForgotPasswordForm,
  type Form,
  type Schema
} from "./forgot-password.form";
import { useCallback } from "react";
import { Box } from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import type { Route } from "./+types/forgot-password.page";
import { Logger } from "~/core/shared/logger";
import { useForgotPassword } from "~/auth/services/auth.service";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { useNavigate } from "react-router";
import { FONOSTER_RESET_PASSWORD_URL } from "~/core/sdk/stores/fonoster.config";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Forgot Password | Fonoster" }];
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { mutateAsync } = useForgotPassword();

  const onSubmit = useCallback(
    async ({ email: username }: Schema, form: Form) => {
      Logger.debug(
        "[<ForgotPasswordPage />]: Submitting forgot password form with data:",
        { username }
      );
      await mutateAsync({
        username,
        resetPasswordUrl: FONOSTER_RESET_PASSWORD_URL
      });

      toast(
        "Ahoy! If that email is registered, we sent you a link to reset your password. Now check your inbox!"
      );

      form.reset();

      navigate("/auth/login", { replace: true });
    },
    []
  );

  return (
    <Box
      width="100%"
      maxWidth="440px"
      gap="40px"
      display="flex"
      flexDirection="column"
    >
      <Box gap="16px" display="flex" flexDirection="column" textAlign="center">
        <Typography variant="heading-large" color="base.03">
          Forgot Password?
        </Typography>
        <Typography variant="body-small" color="base.03">
          Enter the email associated with your account and we’ll send you a link
          to reset your password.
        </Typography>
      </Box>
      <ForgotPasswordForm onSubmit={onSubmit} />
    </Box>
  );
}
