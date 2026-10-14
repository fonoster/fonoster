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
import { Github, Users } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { LabeledSeparator } from "~/components/ui/separator";
import { useAuth } from "~/lib/auth";
import { useAuthMethods } from "~/lib/capabilities";
import { GrpcCode, errorMessage, grpcCode } from "~/lib/errors";
import { AuthLayout, authButton, authInput } from "./auth-layout";
import { startGitHubSignIn } from "./github";
import { inviteInFlight } from "./invite";
import { EMAIL_CONTACT, email } from "./schemas";

/** The same message for a wrong password and an unknown email. */
const INVALID_CREDENTIALS = "Invalid credentials";

const passwordSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password")
});
const codeSchema = z.object({ email });

export default function SignInPage() {
  const methods = useAuthMethods();
  const [params] = useSearchParams();
  const next = params.get("next") ?? "/";
  const [useCode, setUseCode] = useState(false);
  const [invited] = useState(inviteInFlight);

  const description = methods.password
    ? "Use the email and password for this server."
    : methods.openSignup
      ? "New here? The same steps create your account."
      : "Use the email your workspace admin invited.";

  const footer = methods.password ? (
    methods.openSignup ? (
      <>
        <span>No account?</span>
        <Link
          to="/sign-up"
          className="font-medium text-brand-text hover:underline"
        >
          Create an account
        </Link>
      </>
    ) : (
      <>
        <Users className="size-[15px]" aria-hidden />
        <span>No account? Ask your workspace admin for an invite.</span>
      </>
    )
  ) : undefined;

  return (
    <AuthLayout
      title={invited ? "You're invited" : "Sign in"}
      description={invited ? "Sign in to join the workspace." : description}
      footer={invited ? undefined : footer}
    >
      {invited && (
        <Alert variant="success">
          <p className="font-medium">Invite accepted</p>
          <p>
            New to Fonoster? Use the one-time password from your invite email.
            You'll set your own password next.
          </p>
        </Alert>
      )}
      {methods.github && methods.githubConfig && (
        <>
          <Button
            variant="outline"
            className={authButton}
            onClick={() =>
              window.location.assign(startGitHubSignIn(methods.githubConfig!))
            }
          >
            <Github aria-hidden /> Continue with GitHub
          </Button>
          {(methods.password || methods.emailCode) && (
            <LabeledSeparator>or</LabeledSeparator>
          )}
        </>
      )}
      {methods.password && !useCode ? (
        <PasswordForm next={next} />
      ) : (
        methods.emailCode && <CodeRequestForm next={next} />
      )}
      {methods.password && methods.emailCode && (
        <button
          type="button"
          onClick={() => setUseCode(!useCode)}
          className="cursor-pointer self-center font-display text-[13px] text-muted-foreground hover:text-foreground hover:underline"
        >
          {useCode
            ? "Sign in with your password"
            : "Email me a sign-in code instead"}
        </button>
      )}
    </AuthLayout>
  );
}

function PasswordForm({ next }: { next: string }) {
  const { signInWithPassword } = useAuth();
  const navigate = useNavigate();
  const [failure, setFailure] = useState<string | null>(null);
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: "", password: "" }
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    setFailure(null);
    try {
      await signInWithPassword(email, password);
      navigate(next, { replace: true });
    } catch (error) {
      const code = grpcCode(error);
      setFailure(
        code === GrpcCode.PERMISSION_DENIED || code === GrpcCode.UNAUTHENTICATED
          ? INVALID_CREDENTIALS
          : errorMessage(error)
      );
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {failure && (
        <Alert variant="error">
          <p className="font-medium">{failure}</p>
          {failure === INVALID_CREDENTIALS && (
            <p>Check your email and password and try again.</p>
          )}
        </Alert>
      )}
      <Field label="Email" error={errors.email?.message}>
        {(a11y) => (
          <Input
            {...a11y}
            {...form.register("email")}
            type="email"
            autoComplete="email"
            className={authInput}
          />
        )}
      </Field>
      <Field
        label="Password"
        error={errors.password?.message}
        action={
          <Link
            to="/forgot-password"
            className="font-display text-[13px] text-brand-text hover:underline"
          >
            Forgot password?
          </Link>
        }
      >
        {(a11y) => (
          <Input
            {...a11y}
            {...form.register("password")}
            type="password"
            autoComplete="current-password"
            className={authInput}
          />
        )}
      </Field>
      <Button type="submit" className={authButton} loading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}

function CodeRequestForm({ next }: { next: string }) {
  const { client } = useAuth();
  const navigate = useNavigate();
  const [failure, setFailure] = useState<string | null>(null);
  const form = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
    defaultValues: { email: "" }
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setFailure(null);
    try {
      await client.sendVerificationCode(EMAIL_CONTACT, email);
      navigate("/sign-in/code", { state: { email, next, sentAt: Date.now() } });
    } catch (error) {
      setFailure(errorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {failure && <Alert variant="error">{failure}</Alert>}
      <Field label="Work email" error={errors.email?.message}>
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
        Email me a sign-in code
      </Button>
    </form>
  );
}
