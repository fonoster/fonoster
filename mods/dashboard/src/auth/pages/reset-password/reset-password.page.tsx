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

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ResetPasswordForm } from "./reset-password.form";
import { useCallback } from "react";
import { Box } from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import type { Route } from "./+types/reset-password.page";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Reset Password | Fonoster" }];
}

export const schema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
    ),
  confirmPassword: z.string()
});

export const resolver = zodResolver(schema);

export type Schema = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const form = useForm<Schema>({
    resolver,
    defaultValues: {
      password: "",
      confirmPassword: ""
    },
    mode: "onChange"
  });

  const onSubmit = useCallback(
    async (data: Schema) => {
      console.log("Form submitted", data);
      toast("Ahoy! Your password has been reset successfully");
    },
    [form]
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
          Reset your password
        </Typography>
        <Typography variant="body-small" color="base.03">
          Please reset your password using 8+ characters with upper, lower,
          number, and symbol.
        </Typography>
      </Box>
      <ResetPasswordForm {...{ form, onSubmit }} />
    </Box>
  );
}
