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
import { ForgotPasswordForm } from "./forgot-password.form";
import { useCallback } from "react";
import { Box } from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { useNavigate } from "react-router";
import type { Route } from "./+types/forgot-password.page";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Forgot Password | Fonoster" }];
}

export const schema = z.object({ email: z.string().email() });

export const resolver = zodResolver(schema);

export type Schema = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const form = useForm<Schema>({
    resolver,
    defaultValues: {
      email: ""
    },
    mode: "onChange"
  });

  const onSubmit = useCallback(
    async (data: Schema) => {
      console.log("Form submitted", data);
      toast("Ahoy! We have sent you an email to reset your password");

      navigate("/auth/reset-password?token=" + btoa(data.email), {
        replace: true,
        viewTransition: true
      });
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
          Forgot Password?
        </Typography>
        <Typography variant="body-small" color="base.03">
          Enter the email associated with your account and we’ll send you a link
          to reset your password.
        </Typography>
      </Box>
      <ForgotPasswordForm {...{ form, onSubmit }} />
    </Box>
  );
}
