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
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "~/core/components/design-system/forms";
import { Input } from "~/core/components/design-system/ui/input/input";
import { ResourceIdField } from "~/core/components/design-system/ui/resource-id-field/resource-id-field";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { PasswordStrengthBar } from "~/core/components/design-system/ui/password-strength-bar";
import { schema, type Schema } from "./create-credential.schema";
import type { Credentials } from "@fonoster/types";
import { useFormContextSync } from "~/core/hooks/use-form-context-sync";

/**
 * Props interface for the CreateCredentialForm component.
 */
export interface CreateCredentialFormProps extends React.PropsWithChildren {
  /** Optional initial values to populate the form fields with. */
  initialValues?: Schema;
  /** Callback triggered on successful form submission. */
  onSubmit: (data: Schema) => Promise<Credentials | void | null>;
  /** Whether this form is for editing an existing credential. */
  isEdit?: boolean;
}

/**
 * CreateCredentialForm component.
 *
 * Renders a form for creating a credential, including fields for:
 * - Friendly Name
 * - Username
 * - Password
 *
 * Integrates:
 * - React Hook Form for state management
 * - Zod for schema validation
 * - FormContext for state synchronization
 *
 * @param {CreateCredentialFormProps} props - Props including onSubmit handler and optional initial values.
 * @returns {JSX.Element} The rendered Create Credential form.
 */
export function CreateCredentialForm({
  onSubmit,
  initialValues,
  isEdit
}: CreateCredentialFormProps) {
  /** Initializes the React Hook Form with Zod validation and initial values. */
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      ref: null,
      name: "",
      username: "",
      password: ""
    },
    mode: "onChange"
  });

  const watchPassword = form.watch("password");

  /** Sync form state with FormContext */
  useFormContextSync(form, onSubmit, isEdit);

  /**
   * Renders the form with individual fields wrapped in FormField and FormItem components.
   */
  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        {/* Credential ID - Only show in edit mode */}
        {isEdit && initialValues?.ref && (
          <ResourceIdField value={initialValues.ref} label="Credential Ref" />
        )}

        {/* Friendly Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="text" label="Friendly Name" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Username Field */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="text" label="Username" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="password" label="Password" {...field} />
                <PasswordStrengthBar password={watchPassword || ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </FormRoot>
    </Form>
  );
}
