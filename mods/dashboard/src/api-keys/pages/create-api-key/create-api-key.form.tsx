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
import { Role } from "@fonoster/types";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useImperativeHandle } from "react";
import { schema, type Schema } from "./create-api-key.schema";
import { Select } from "~/core/components/design-system/ui/select/select";

/**
 * Imperative handle interface exposing a submit method and validation state.
 *
 * Allows parent components to trigger form submission and to check if the submit button should be disabled.
 */
export interface CreateApiKeyFormHandle {
  submit: () => void;
  reset: () => void;
}

/**
 * Props interface for the CreateApiKeyForm component.
 */
export interface CreateApiKeyFormProps extends React.PropsWithChildren {
  /** Optional initial values to populate the form fields with. */
  initialValues?: Schema;
  /** Callback triggered on successful form submission. */
  onSubmit: (data: Schema) => Promise<void>;
}

/**
 * CreateApiKeyForm component.
 *
 * Renders a form for creating a apiKey, including fields for:
 * - Friendly Name
 * - Trunk
 * - Country
 * - City
 * - Tel URL
 * - Inbound Application
 *
 * Integrates:
 * - React Hook Form for state management
 * - Zod for schema validation
 * - Imperative handle for exposing a submit method to parent components
 *
 * @param {CreateApiKeyFormProps} props - Props including onSubmit handler and optional initial values.
 * @param {React.Ref<CreateApiKeyFormHandle>} ref - Ref exposing submit functionality.
 * @returns {JSX.Element} The rendered Create ApiKey form.
 */
export const CreateApiKeyForm = forwardRef<
  CreateApiKeyFormHandle,
  CreateApiKeyFormProps
>(({ onSubmit, initialValues }, ref) => {
  /** Initializes the React Hook Form with Zod validation and initial values. */
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      ref: null,
      role: Role.WORKSPACE_ADMIN
    },
    mode: "onChange"
  });

  /** Exposes the submit method and submit state via the imperative handle. */
  useImperativeHandle(ref, () => ({
    submit: () => {
      form.handleSubmit(onSubmit)();
    },
    reset: () => {
      form.reset();
    }
  }));

  /**
   * Renders the form with individual fields wrapped in FormField and FormItem components.
   */
  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        {/* Application Type Field */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select
                  label="Application Type"
                  options={Object.values(Role).map((role) => ({
                    value: role,
                    label: role.charAt(0).toUpperCase() + role.slice(1)
                  }))}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </FormRoot>
    </Form>
  );
});
