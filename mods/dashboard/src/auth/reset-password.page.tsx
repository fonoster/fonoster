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
import { ArrowLeft, Lock } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { z } from "zod";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/sonner";
import { useSdk } from "~/lib/auth";
import { errorMessage } from "~/lib/errors";
import { AuthLayout, authButton } from "./auth-layout";
import { NewPasswordFields } from "./password-fields";
import { newPasswordForm } from "./schemas";

type ResetToken = { username: string; code: string };

/** The link's token is base64 JSON; "+" may arrive as a space in the query. */
export function parseResetToken(token: string | null): ResetToken | null {
  if (!token) return null;
  try {
    const value = JSON.parse(
      atob(token.replace(/ /g, "+"))
    ) as Partial<ResetToken>;
    return value.username && value.code
      ? { username: value.username, code: value.code }
      : null;
  } catch {
    return null;
  }
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = parseResetToken(params.get("token"));
  const back = (
    <Link
      to="/sign-in"
      className="inline-flex items-center gap-1.5 hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden /> Back to sign in
    </Link>
  );

  if (!token) {
    return (
      <AuthLayout title="This link doesn't work" footer={back}>
        <Alert variant="error">
          The reset link is incomplete or damaged. Ask for a new one from{" "}
          <Link to="/forgot-password" className="underline">
            Forgot password
          </Link>
          .
        </Alert>
      </AuthLayout>
    );
  }

  return <ResetPasswordForm token={token} footer={back} />;
}

function ResetPasswordForm({
  token,
  footer
}: {
  token: ResetToken;
  footer: React.ReactNode;
}) {
  const sdk = useSdk();
  const navigate = useNavigate();
  const [failure, setFailure] = useState<string | null>(null);
  const form = useForm<z.infer<typeof newPasswordForm>>({
    resolver: zodResolver(newPasswordForm),
    defaultValues: { password: "", confirm: "" }
  });

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setFailure(null);
    try {
      await sdk.users.resetPassword({
        username: token.username,
        verificationCode: token.code,
        password
      });
      toast.success("Password updated. Sign in with your new password.");
      navigate("/sign-in", { replace: true });
    } catch (error) {
      setFailure(
        errorMessage(error, "The link has expired. Ask for a new one.")
      );
    }
  });

  return (
    <AuthLayout
      icon={Lock}
      title="Choose a new password"
      description={`For ${token.username}. You'll sign in with it next time.`}
      footer={footer}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {failure && <Alert variant="error">{failure}</Alert>}
        <NewPasswordFields form={form} />
        <Button
          type="submit"
          className={authButton}
          loading={form.formState.isSubmitting}
        >
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
