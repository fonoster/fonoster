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
  ResetPasswordForm,
  type Form,
  type Schema
} from "./reset-password.form";
import { useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import type { Route } from "./+types/reset-password.page";
import { Logger } from "~/core/shared/logger";
import { useNavigate, useSearchParams } from "react-router";
import { useResetPassword } from "~/auth/services/auth.service";

export interface ResetPasswordTokenPayload {
  username: string;
  code: string;
}

export function meta(_: Route.MetaArgs) {
  return [{ title: "Reset Password | Fonoster" }];
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { mutateAsync } = useResetPassword();

  useEffect(() => {
    if (!token) {
      toast("Token is missing. Please check the link you clicked.");
      navigate("/auth/login", { replace: true });
    }
  }, [token, setSearchParams]);

  const onSubmit = useCallback(async ({ password }: Schema, form: Form) => {
    if (!token) {
      toast("Token is missing. Please check the link you clicked.");
      return;
    }

    try {
      const payload = JSON.parse(atob(token)) as ResetPasswordTokenPayload;

      if (
        Object.keys(payload).length !== 2 ||
        !payload.username ||
        !payload.code
      ) {
        toast("Invalid token format. Please check the link you clicked.");
        return;
      }

      const { username, code: verificationCode } = payload;

      await mutateAsync({ username, verificationCode, password });
      toast("Password reset successfully! You can now log in.");
      navigate("/auth/login", { replace: true });
    } catch (error) {
      Logger.error("[ResetPasswordPage] Error resetting password", error);
      toast("Failed to reset password. Please try again.");

      form.reset();
    }
  }, []);

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
          Reset your password
        </Typography>
        <Typography variant="body-small" color="base.03">
          Please reset your password using 8+ characters with upper, lower,
          number, and symbol.
        </Typography>
      </Box>
      <ResetPasswordForm onSubmit={onSubmit} />
    </Box>
  );
}
