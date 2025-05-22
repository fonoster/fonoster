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
import { LoginForm, type Schema } from "./login.form";
import { useCallback } from "react";
import { Box } from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import type { Route } from "./+types/login.page";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Log In | Fonoster" }];
}

export default function LoginPage() {
  const onSubmit = useCallback(async (data: Schema) => {
    console.log("Form submitted", data);
    toast("Login not implemented yet");
  }, []);

  const onGithubAuth = useCallback(async () => {
    console.log("Github auth");
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
        Sign In
      </Typography>
      <LoginForm {...{ onSubmit, onGithubAuth }} />
    </Box>
  );
}
