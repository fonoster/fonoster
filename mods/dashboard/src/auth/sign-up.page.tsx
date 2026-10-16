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
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { useAuth } from "~/lib/auth";
import { useAuthMethods } from "~/lib/capabilities";
import { GrpcCode, errorMessage, grpcCode } from "~/lib/errors";
import { AuthLayout, authButton, authInput } from "./auth-layout";
import { email, newPassword } from "./schemas";

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name"),
  email,
  password: newPassword
});

export default function SignUpPage() {
  const methods = useAuthMethods();
  if (!methods.openSignup || !methods.password)
    return <Navigate to="/sign-in" replace />;
  return <SignUpForm />;
}

function SignUpForm() {
  const { sdk, signInWithPassword } = useAuth();
  const navigate = useNavigate();
  const [failure, setFailure] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" }
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ name, email, password }) => {
    setFailure(null);
    try {
      await sdk.users.createUser({ name, email, password, avatar: "" });
      await signInWithPassword(email, password);
      navigate("/", { replace: true });
    } catch (error) {
      setFailure(
        grpcCode(error) === GrpcCode.ALREADY_EXISTS
          ? "An account with that email already exists. Sign in instead."
          : errorMessage(error)
      );
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      description="Sign-up is open on this server. You'll create a workspace next."
      footer={
        <>
          <span>Already have an account?</span>
          <Link
            to="/sign-in"
            className="font-medium text-brand-text hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {failure && <Alert variant="error">{failure}</Alert>}
        <Field label="Name" error={errors.name?.message}>
          {(a11y) => (
            <Input
              {...a11y}
              {...form.register("name")}
              autoComplete="name"
              className={authInput}
            />
          )}
        </Field>
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
          hint="At least 8 characters."
        >
          {(a11y) => (
            <Input
              {...a11y}
              {...form.register("password")}
              type="password"
              autoComplete="new-password"
              className={authInput}
            />
          )}
        </Field>
        <Button type="submit" className={authButton} loading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
