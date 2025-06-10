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
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "~/core/components/design-system/forms";
import { Input } from "~/core/components/design-system/ui/input/input";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { LoginFormActions } from "./login.actions";

/**
 * Zod validation schema for the login form.
 * Validates that:
 *  - email is a valid email address.
 *  - password has at least 8 characters.
 */
export const schema = z.object({
  email: z.string().nonempty(),
  password: z.string().nonempty()
});

/**
 * Hook-form resolver using Zod for validation.
 */
export const resolver = zodResolver(schema);

/**
 * Type representing the validated schema.
 */
export type Schema = z.infer<typeof schema>;

/**
 * Type representing the hook-form return object.
 */
export type Form = UseFormReturn<Schema>;

/**
 * Props interface for the LoginForm component.
 */
export interface LoginFormProps extends React.PropsWithChildren {
  /**
   * Called when the form is successfully submitted and validated.
   * @param data - The validated form data.
   * @param form - The hook-form instance.
   */
  onSubmit: (data: Schema, form: Form) => Promise<void>;

  /**
   * Called when the user clicks on the GitHub login button.
   */
  onGithubAuth: () => Promise<void>;
}

/**
 * LoginForm component.
 * Renders the email and password fields, handles validation, and manages submission logic.
 * Integrates GitHub authentication and disables the submit button while submitting or when invalid.
 *
 * @param onSubmit - Function to handle form submission.
 * @param onGithubAuth - Function to handle GitHub authentication.
 */
export function LoginForm({ onSubmit, onGithubAuth }: LoginFormProps) {
  /** Initializes react-hook-form with validation resolver and default values. */
  const form = useForm<Schema>({
    resolver,
    defaultValues: {
      email: "",
      password: ""
    },
    mode: "onChange"
  });

  /**
   * Memoized submit handler that passes the validated data to the onSubmit prop.
   */
  const onSubmitForm = useCallback(
    async (data: Schema) => onSubmit(data, form),
    [onSubmit, form]
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmitForm)}>
        {/* Email field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="email"
                  label="Email Address"
                  supportingText="Please enter your email address"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Password field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="password"
                  label="Password"
                  supportingText="Please enter your password"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Form actions: submit and GitHub auth */}
        <LoginFormActions {...{ form, onGithubAuth }} />
      </FormRoot>
    </Form>
  );
}
