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
import { Box, styled } from "@mui/material";
import { Button } from "~/core/components/design-system/ui/button/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCallback } from "react";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { useCreateWorkspace } from "~/workspaces/services/workspaces.service";
import { getErrorMessage } from "~/core/helpers/extract-error-message";

/**
 * Zod schema for form validation.
 * Defines the expected shape of the workspace form data.
 */
export const schema = z.object({
  name: z.string().nonempty()
});

/** Resolver for react-hook-form using zod */
export const resolver = zodResolver(schema);

/** Type inferred from the zod schema */
export type Schema = z.infer<typeof schema>;

/**
 * Props for the CreateWorkspaceForm component.
 *
 * @property {function} [onFormSubmit] - Optional callback executed after successful form submission.
 */
export interface CreateWorkspaceFormProps extends React.PropsWithChildren {
  onFormSubmit?: (data: Schema) => void;
}

/**
 * CreateWorkspaceForm component
 *
 * Renders a form to create a new workspace, including validation,
 * submission, and feedback via toasts.
 *
 * @param {CreateWorkspaceFormProps} props - Props including optional onFormSubmit handler.
 * @returns {JSX.Element} The rendered form.
 */
export function CreateWorkspaceForm({
  onFormSubmit
}: CreateWorkspaceFormProps) {
  /** Hook to create a new workspace via API */
  const { mutate, isPending } = useCreateWorkspace();

  /** Initializes the react-hook-form instance with validation resolver and default values */
  const form = useForm<Schema>({
    resolver,
    defaultValues: {
      name: ""
    },
    mode: "onChange"
  });

  /**
   * Form submission handler.
   * Calls the mutate function, shows a toast, resets the form,
   * and optionally invokes the onFormSubmit callback.
   *
   * @param {Schema} data - The validated form data.
   */
  const onSubmit = useCallback(
    async (data: Schema) => {
      try {
        mutate(data);
        toast("Ahoy! Workspace created successfully");
        form.reset();

        if (onFormSubmit) {
          onFormSubmit(data);
        }
      } catch (error) {
        toast(getErrorMessage(error));
      }
    },
    [form, mutate, onFormSubmit]
  );

  /** Extracts form state for disabling the submit button when needed */
  const { isValid, isSubmitting } = form.formState;
  const isSubmitDisabled = !isValid || isSubmitting || isPending;

  /**
   * Renders the form, including an input field for the workspace name
   * and a submit button that is disabled while submitting or when the form is invalid.
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
                <Input
                  type="text"
                  label="Name"
                  supportingText="Please enter your full name"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <ActionsRoot>
          <Button type="submit" disabled={isSubmitDisabled}>
            {isSubmitting ? "Loading..." : "Create Workspace"}
          </Button>
        </ActionsRoot>
      </FormRoot>
    </Form>
  );
}

/**
 * Styled component for the container of the form actions.
 * Centers the submit button horizontally and vertically.
 */
export const ActionsRoot = styled(Box)(() => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
}));
