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
import { forwardRef, useCallback, useImperativeHandle } from "react";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { useAuth } from "~/auth/hooks/use-auth";
import { getErrorMessage } from "~/core/helpers/extract-error-message";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box } from "@mui/material";
import { useUpdateUser } from "~/auth/services/auth.service";

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

/** React Hook Form resolver for Zod validation. */
export const resolver = zodResolver(schema);

/** Type inferred from the Zod schema. */
export type Schema = z.infer<typeof schema>;

/**
 * Imperative handle interface for the workspace profile form.
 * Allows the parent component to trigger form submission and check if the form is valid.
 */
export interface PersonalSettingsFormHandle {
  submit: () => void;
}

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
 * Renders the workspace profile form, including inputs for the workspace name and timezone.
 * Handles form submission, validation, and toast notifications.
 *
 * @param {PersonalSettingsProps} props - Props including an optional onFormSubmit callback.
 * @param {React.Ref<PersonalSettingsFormHandle>} ref - Ref to expose submit functionality to parent.
 * @returns {JSX.Element} The rendered workspace profile form.
 */
export const PersonalSettingsForm = forwardRef<
  PersonalSettingsFormHandle,
  PersonalSettingsProps
>(({ onFormSubmit }, ref) => {
  const { user, setUser } = useAuth();

  /** Mutation hook to update the workspace on the server. */
  const { mutate, isPending } = useUpdateUser();

  /** Initializes react-hook-form with validation and default values. */
  const form = useForm<Schema>({
    resolver,
    defaultValues: {
      password: "",
      confirmPassword: "",
      avatar: "",
      ...user
    },
    mode: "onChange"
  });

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
    [mutate, onFormSubmit]
  );

  /**
   * Exposes imperative methods to parent component:
   * - submit: triggers form submission
   * - isSubmitDisabled: indicates if the submit button should be disabled
   */
  useImperativeHandle(ref, () => ({
    submit: () => form.handleSubmit(onSubmit)()
  }));

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

        <Box sx={{ display: "flex", mt: 2 }}>
          <Button
            type="submit"
            disabled={
              form.formState.isSubmitting ||
              !form.formState.isValid ||
              isPending ||
              !form.formState.isDirty
            }
          >
            {form.formState.isSubmitting ? "Updating..." : "Save Changes"}
          </Button>
        </Box>
      </FormRoot>
    </Form>
  );
});
