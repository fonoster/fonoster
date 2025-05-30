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
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box, styled } from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { Divider } from "~/core/components/design-system/ui/divider/divider";
import { Link } from "~/core/components/general/link/link";
import type { Form } from "./login.form";
import { useSearchParams } from "react-router";
import { useEffect } from "react";

/**
 * Props interface for LoginFormActions component.
 * Includes the form object (from React Hook Form) and a GitHub auth handler.
 */
export interface LoginFormActionsProps extends React.PropsWithChildren {
  form: Form;
  onGithubAuth: () => Promise<void>;
}

/**
 * Component responsible for rendering the actions (buttons and links) within the login form.
 * Includes:
 *  - Sign In button
 *  - GitHub Sign In button
 *  - Forgot Password link
 *  - Sign Up link
 *
 * Displays form error messages from URL query parameters and disables the submit button
 * when the form is invalid or currently submitting.
 */
export function LoginFormActions({
  form,
  onGithubAuth
}: LoginFormActionsProps) {
  /** Extracts query parameters from the URL to check for error messages. */
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  /** Destructure form state for validation and submission status. */
  const { isValid, isSubmitting } = form.formState;

  /** Determines if the Sign In button should be disabled. */
  const isSubmitDisabled = !isValid || isSubmitting;

  /**
   * Effect hook to set error messages in the form state
   * if an error is detected in the URL query parameters.
   */
  useEffect(() => {
    if (error) {
      form.setError("email", { type: "manual", message: error });
    }
  }, [error, form]);

  return (
    <LoginFormRoot>
      {/* Main Sign In button */}
      <Button type="submit" isFullWidth disabled={isSubmitDisabled}>
        {isSubmitting ? "Signing In..." : "Sign In"}
      </Button>

      {/* Divider between the primary sign in and the alternative login */}
      <Divider />

      {/* GitHub Sign In button */}
      <Button
        isFullWidth
        variant="outlined"
        disabled={isSubmitting}
        onClick={onGithubAuth}
      >
        Sign In with GitHub
      </Button>

      {/* Forgot Password link */}
      <Link to="/auth/forgot-password">
        <Typography variant="body-small" color="base.03">
          Forgot Password?
        </Typography>
      </Link>

      {/* Sign Up link */}
      <Typography variant="body-small" color="base.03">
        Don't have an account? <Link to="/auth/signup">Sign Up</Link>
      </Typography>
    </LoginFormRoot>
  );
}

/**
 * Styled component for organizing the layout of the login form actions.
 * Uses a vertical flex layout with spacing and text alignment.
 */
export const LoginFormRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  textAlign: "center",
  marginTop: theme.spacing(2)
}));
