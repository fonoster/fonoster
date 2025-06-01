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
import { SignupForm } from "./sign-up.form";
import { useCallback } from "react";
import { Box } from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import type { Route } from "./+types/sign-up.page";
import { Logger } from "~/core/shared/logger";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Sign Up | Fonoster" }];
}

export const schema = z.object({
  name: z.string().nonempty(),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
    ),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions"
  })
});

export const resolver = zodResolver(schema);

export type Schema = z.infer<typeof schema>;

export default function SignupPage() {
  const form = useForm<Schema>({
    resolver,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false
    },
    mode: "onChange"
  });

  const onSubmit = useCallback(
    async (data: Schema) => {
      Logger.debug("[SignupPage] onSubmit data...", data);
      toast("Signup not implemented yet");
    },
    [form]
  );

  const onGithubAuth = useCallback(async () => {
    Logger.debug("[SignupPage] onGithubAuth called");
    toast("Github auth not implemented yet");
  }, []);

  return (
    <Box
      width="100%"
      maxWidth="440px"
      gap="40px"
      display="flex"
      flexDirection="column"
    >
      <Typography
        variant="heading-large"
        color="base.03"
        sx={{ textAlign: "center" }}
      >
        Sign up for Fonoster
      </Typography>
      <SignupForm {...{ form, onSubmit, onGithubAuth }} />
    </Box>
  );
}
