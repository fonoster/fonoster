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
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { useSdk } from "~/lib/auth";
import { errorMessage } from "~/lib/errors";
import { AuthLayout, authButton, authInput } from "./auth-layout";
import { email } from "./schemas";

const schema = z.object({ email });

export default function ForgotPasswordPage() {
  const sdk = useSdk();
  const [sent, setSent] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" }
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setFailure(null);
    try {
      await sdk.users.sendResetPasswordCode({
        username: email,
        resetPasswordUrl: `${window.location.origin}/reset-password`
      });
      setSent(true);
    } catch (error) {
      setFailure(errorMessage(error));
    }
  });

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your email and we'll send you a link to choose a new password."
      footer={
        <Link
          to="/sign-in"
          className="inline-flex items-center gap-1.5 hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <Alert variant="success">
          If an account exists for that email, the link arrives in a minute.
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {failure && <Alert variant="error">{failure}</Alert>}
          <Field label="Email" error={errors.email?.message}>
            {(a11y) => (
              <Input
                {...a11y}
                {...form.register("email")}
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className={authInput}
              />
            )}
          </Field>
          <Button type="submit" className={authButton} loading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
