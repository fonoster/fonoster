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
import { forwardRef, useCallback, useEffect, useImperativeHandle } from "react";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { Select } from "~/core/components/design-system/ui/select/select";
import { useUpdateWorkspace } from "~/workspaces/services/workspaces.service";
import { useAuth } from "~/auth/hooks/use-auth";
import { useNavigate } from "react-router";
import { TIMEZONES } from "./settings.const";

/**
 * Zod schema for workspace settings form validation.
 * Defines the expected fields and their types.
 */
export const schema = z.object({
  name: z.string(),
  timezone: z.string()
});

/** React Hook Form resolver for Zod validation. */
export const resolver = zodResolver(schema);

/** Type inferred from the Zod schema. */
export type Schema = z.infer<typeof schema>;

/**
 * Imperative handle interface for the workspace settings form.
 * Allows the parent component to trigger form submission and check if the form is valid.
 */
export interface WorkspaceSettingsFormHandle {
  submit: () => void;
  isSubmitDisabled?: boolean;
}

/**
 * Props for the WorkspaceSettingsForm component.
 *
 * @property {function} [onFormSubmit] - Optional callback executed after successful form submission.
 */
export interface WorkspaceSettingsProps extends React.PropsWithChildren {
  onFormSubmit?: (data: Schema) => void;
}

/**
 * WorkspaceSettingsForm component
 *
 * Renders the workspace settings form, including inputs for the workspace name and timezone.
 * Handles form submission, validation, and toast notifications.
 *
 * @param {WorkspaceSettingsProps} props - Props including an optional onFormSubmit callback.
 * @param {React.Ref<WorkspaceSettingsFormHandle>} ref - Ref to expose submit functionality to parent.
 * @returns {JSX.Element} The rendered workspace settings form.
 */
export const WorkspaceSettingsForm = forwardRef<
  WorkspaceSettingsFormHandle,
  WorkspaceSettingsProps
>(({ onFormSubmit }, ref) => {
  /** Retrieves the current workspace from the auth context. */
  const { currentWorkspace } = useAuth();

  /** Mutation hook to update the workspace on the server. */
  const { mutate, isPending } = useUpdateWorkspace();

  /** Initializes react-hook-form with validation and default values. */
  const form = useForm<Schema>({
    resolver,
    defaultValues: currentWorkspace || {
      name: "",
      timezone: "UTC"
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
    async (data: Schema) => {
      try {
        if (!currentWorkspace) {
          toast(
            "Oops! We are unable to find your workspace :( Please try again later."
          );
          return;
        }

        const { ref } = currentWorkspace;

        mutate({ ref, ...data });
        toast("Ahoy! Your workspace has been updated successfully");

        if (onFormSubmit) {
          onFormSubmit(data);
        }
      } catch (error) {
        toast("Oops! Something went wrong while updating your workspace.");
      }
    },
    [currentWorkspace, mutate, onFormSubmit]
  );

  /** Hook to navigate to another page if workspace is not found. */
  const navigate = useNavigate();

  /**
   * Exposes imperative methods to parent component:
   * - submit: triggers form submission
   * - isSubmitDisabled: indicates if the submit button should be disabled
   */
  useImperativeHandle(ref, () => ({
    submit: () => {
      form.handleSubmit(onSubmit)();
    },
    isSubmitDisabled:
      form.formState.isSubmitting || !form.formState.isValid || isPending
  }));

  /**
   * Effect that redirects the user if currentWorkspace is undefined.
   */
  useEffect(() => {
    if (!currentWorkspace) {
      toast(
        "Oops! We are unable to find your workspace :( Please try again later."
      );
      navigate("/");
    }
  }, [currentWorkspace, navigate]);

  /**
   * Renders the workspace settings form with inputs for name and timezone.
   */
  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        {/* Workspace Name Input */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  label="Workspace Name"
                  supportingText="Please enter your full name"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Timezone Select Input */}
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select label="Timezone" options={TIMEZONES} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </FormRoot>
    </Form>
  );
});
