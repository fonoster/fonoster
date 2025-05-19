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
import { type UseFormReturn } from "react-hook-form";
import type { Schema } from "./sign-up.page";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box, styled } from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { Divider } from "~/core/components/design-system/ui/divider/divider";
import { Link } from "~/core/components/general/link/link";

export interface SignupFormActionsProps extends React.PropsWithChildren {
  form: UseFormReturn<Schema>;
  onGithubAuth: () => Promise<void>;
}

export function SignupFormActions({
  form,
  onGithubAuth
}: SignupFormActionsProps) {
  const { isValid, isSubmitting } = form.formState;
  const isSubmitDisabled = !isValid || isSubmitting;

  return (
    <LoginFormRoot>
      <Button type="submit" isFullWidth disabled={isSubmitDisabled}>
        {isSubmitting ? "Loading..." : "Sign up for Fonoster"}
      </Button>

      <Divider />

      <Button
        isFullWidth
        variant="outlined"
        disabled={isSubmitting}
        onClick={onGithubAuth}
      >
        Sign Up with GitHub
      </Button>

      <Typography variant="body-small" color="base.03">
        Already have an account? <Link to="/auth/login">Sign In</Link>
      </Typography>
    </LoginFormRoot>
  );
}

export const LoginFormRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  textAlign: "center",
  marginTop: theme.spacing(2)
}));
