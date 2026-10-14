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
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import type { z } from "zod";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/lib/auth";
import { errorMessage } from "~/lib/errors";
import { AuthLayout, authButton } from "./auth-layout";
import { NewPasswordFields } from "./password-fields";
import { newPasswordForm } from "./schemas";

/** Invitees land here until they replace the invite's one-time password. */
export default function SetPasswordPage() {
  const { user, sdk, refreshSession, signOut } = useAuth();
  const navigate = useNavigate();
  const [failure, setFailure] = useState<string | null>(null);
  const form = useForm<z.infer<typeof newPasswordForm>>({
    resolver: zodResolver(newPasswordForm),
    defaultValues: { password: "", confirm: "" }
  });

  const onSubmit = form.handleSubmit(async ({ password }) => {
    if (!user) return;
    setFailure(null);
    try {
      await sdk.users.updateUser({ ref: user.sub, password });
      await refreshSession();
      navigate("/", { replace: true });
    } catch (error) {
      setFailure(errorMessage(error));
    }
  });

  return (
    <AuthLayout
      title="Set your password"
      description={
        <>
          Your workspace admin gave you a one-time password. Choose your own to
          continue. Signed in as{" "}
          <span className="font-medium text-foreground">{user?.email}</span>.
        </>
      }
      footer={
        <button
          type="button"
          onClick={() => signOut()}
          className="cursor-pointer hover:text-foreground hover:underline"
        >
          Sign out
        </button>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {failure && <Alert variant="error">{failure}</Alert>}
        <NewPasswordFields form={form} />
        <Button
          type="submit"
          className={authButton}
          loading={form.formState.isSubmitting}
        >
          Set password and continue
        </Button>
      </form>
    </AuthLayout>
  );
}
