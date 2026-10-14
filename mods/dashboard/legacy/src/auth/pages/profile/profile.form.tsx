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
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "~/core/components/design-system/forms";
import { Input } from "~/core/components/design-system/ui/input/input";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCallback } from "react";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { useAuth } from "~/auth/hooks/use-auth";
import { getErrorMessage } from "~/core/helpers/extract-error-message";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { useUpdateUser } from "~/auth/services/auth.service";
import { useFormContextSync } from "~/core/hooks/use-form-context-sync";
import { PasswordStrengthBar } from "~/core/components/design-system/ui/password-strength-bar";
import { ThemeSwitch } from "~/core/components/general/theme-switch";

/**
 * Zod schema for workspace profile form validation.
 * Defines the expected fields and their types.
 */
export const schema = z.object({
  name: z.string().nonempty(),
  email: z.string().email(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  avatar: z.string().optional()
});

/** Type inferred from the Zod schema. */
export type Schema = z.infer<typeof schema>;

/**
 * Props for the PersonalSettingsForm component.
 *
 * @property {function} [onFormSubmit] - Optional callback executed after successful form submission.
 */
export interface PersonalSettingsProps extends React.PropsWithChildren {
  onFormSubmit?: (data: Schema) => void;
}

/**
 * PersonalSettingsForm component
 *
 * Renders the personal settings form, including inputs for name, email, password, and avatar.
 * Handles form submission, validation, and toast notifications.
 *
 * @param {PersonalSettingsProps} props - Props including an optional onFormSubmit callback.
 * @returns {JSX.Element} The rendered personal settings form.
 */
export function PersonalSettingsForm({ onFormSubmit }: PersonalSettingsProps) {
  const { user, setUser } = useAuth();

  /** Mutation hook to update the workspace on the server. */
  const { mutate, isPending } = useUpdateUser();

  /** Initializes react-hook-form with validation and default values. */
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      avatar: "",
      ...user
    },
    mode: "onChange"
  });

  const watchPassword = form.watch("password");

  /**
   * Handles form submission:
   * - Validates workspace existence
   * - Calls mutate to update the workspace
   * - Displays success or error toasts
   * - Calls onFormSubmit if provided
   */
  const onSubmit = useCallback(
    async ({ password, confirmPassword, ...data }: Schema) => {
      try {
        if (password && password !== confirmPassword) {
          form.setError("confirmPassword", {
            type: "manual",
            message: "Passwords do not match"
          });
          return;
        }

        const { id: ref } = user;
        mutate({ ref, password, ...data });
        setUser({ ...user, ...data });
        form.reset({ ...data, password: "", confirmPassword: "" });

        toast("Ahoy! Your profile has been updated successfully.");

        if (onFormSubmit) {
          onFormSubmit(data);
        }
      } catch (error) {
        toast(getErrorMessage(error));
      }
    },
    [mutate, onFormSubmit, user, form, setUser]
  );

  /** Sync form state with FormContext */
  useFormContextSync(form, onSubmit);

  /**
   * Renders the workspace profile form with inputs for name and timezone.
   */
  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="text" label="Full Name" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="email" label="Email Address" disabled {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Typography variant="body-large" sx={{ mt: 2 }}>
          Change Password
        </Typography>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="password"
                  label="New Password"
                  placeholder="Enter new password"
                  {...field}
                />
                <PasswordStrengthBar password={watchPassword || ""} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="password"
                  label="Confirm Password"
                  placeholder="Re-enter new password"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Typography variant="body-large" sx={{ mt: 2 }}>
          Avatar
        </Typography>

        <FormField
          control={form.control}
          name="avatar"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  label="Avatar URL"
                  placeholder="https://example.com/avatar.png"
                  supportingText="This will be used as your profile picture."
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Typography variant="body-large" sx={{ mt: 2 }}>
          Appearance
        </Typography>

        <ThemeSwitch />
      </FormRoot>
    </Form>
  );
}
