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
import { ROLE_LABELS } from "~/workspaces/pages/[workspace]/members/members.constants";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { schema, type Schema } from "./create-api-key.schema";
import { Select } from "~/core/components/design-system/ui/select/select";
import { useFormContextSync } from "~/core/hooks/use-form-context-sync";

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
 * Renders a form for creating an API Key, including fields for:
 * - Access Role
 *
 * Integrates:
 * - React Hook Form for state management
 * - Zod for schema validation
 * - FormContextSync for external form control
 *
 * @param {CreateApiKeyFormProps} props - Props including onSubmit handler and optional initial values.
 * @returns {JSX.Element} The rendered Create ApiKey form.
 */
export function CreateApiKeyForm({
  onSubmit,
  initialValues
}: CreateApiKeyFormProps) {
  /** Initializes the React Hook Form with Zod validation and initial values. */
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      ref: null,
      role: Role.WORKSPACE_ADMIN
    },
    mode: "onChange"
  });

  /** Sync form state with FormContext */
  useFormContextSync(form, onSubmit);

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
                  label="Access Role"
                  options={[
                    {
                      value: Role.WORKSPACE_ADMIN,
                      label: ROLE_LABELS[Role.WORKSPACE_ADMIN]
                    }
                  ]}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </FormRoot>
    </Form>
  );
}
