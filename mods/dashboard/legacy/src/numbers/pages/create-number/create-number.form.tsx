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
import { useEffect } from "react";
import { Select } from "~/core/components/design-system/ui/select/select";
import { ResourceIdField } from "~/core/components/design-system/ui/resource-id-field/resource-id-field";
import {
  NUMBERS_DEFAULT_INITIAL_VALUES,
  COUNTRIES
} from "./create-number.const";
import { useApplications } from "~/applications/services/applications.service";
import { useTrunks } from "~/trunks/services/trunks.service";
import { useFormContextSync } from "~/core/hooks/use-form-context-sync";

/**
 * Zod validation schema for the Create Number form.
 *
 * Defines the expected structure and validation rules for the number creation fields.
 */
export const schema = z.object({
  /** Reference ID of the number (nullable) */
  ref: z.string().nullish(),
  /** Human-readable name of the number */
  name: z.string().nonempty(),
  /** Reference to the associated trunk (optional) */
  trunkRef: z.string().optional(),
  /** Country name */
  country: z.string().nonempty(),
  /** City name */
  city: z.string().nonempty(),
  /** Telephone URL (validated as URL) */
  telUrl: z.string().url(),
  /** Reference to the application (optional) */
  appRef: z.string().optional(),
  /** Agent Address of Record (optional) */
  agentAor: z.string().optional()
});

/** Type representing the validated data structure. */
export type Schema = z.infer<typeof schema>;

/**
 * Props interface for the CreateNumberForm component.
 */
export interface CreateNumberFormProps extends React.PropsWithChildren {
  /** Optional initial values to populate the form fields with. */
  initialValues?: Schema;
  /** Callback triggered on successful form submission. */
  onSubmit: (data: Schema) => Promise<void>;
  /** Whether this form is for editing an existing number. */
  isEdit?: boolean;
}

/**
 * CreateNumberForm component.
 *
 * Renders a form for creating a number, including fields for:
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
 * - FormContext for state synchronization
 *
 * @param {CreateNumberFormProps} props - Props including onSubmit handler and optional initial values.
 * @returns {JSX.Element} The rendered Create Number form.
 */
export function CreateNumberForm({
  onSubmit,
  initialValues,
  isEdit
}: CreateNumberFormProps) {
  /** Fetches trunks to populate the Trunk dropdown. */
  const { data: trunks, isLoading: isTrunkLoading } = useTrunks({});

  /** Fetches applications to populate the Inbound Application dropdown. */
  const { data: applications, isLoading: isApplicationLoading } =
    useApplications();

  /** Initializes the React Hook Form with Zod validation and initial values. */
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: initialValues || NUMBERS_DEFAULT_INITIAL_VALUES,
    mode: "onChange"
  });

  // Ensure pristine state on mount/update with provided initial values
  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  /** Sync form state with FormContext */
  useFormContextSync(form, onSubmit);

  /**
   * Renders the form with individual fields wrapped in FormField and FormItem components.
   */
  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        {/* Number ID - Only show in edit mode */}
        {isEdit && initialValues?.ref && (
          <ResourceIdField value={initialValues.ref} label="Number Ref" />
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

        {/* Trunk Selection Field */}
        <FormField
          control={form.control}
          name="trunkRef"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select
                  label="Trunk"
                  options={trunks.map(({ ref, name }) => ({
                    value: ref,
                    label: name
                  }))}
                  disabled={isTrunkLoading || trunks.length === 0}
                  placeholder={
                    isTrunkLoading
                      ? "Loading trunks..."
                      : trunks.length === 0
                        ? "No trunks found. Please create a Trunk first."
                        : ""
                  }
                  allowClear={true}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Country Selection Field */}
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select label="Country" options={COUNTRIES} {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* City Field */}
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="text" label="City" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Tel URL Field */}
        <FormField
          control={form.control}
          name="telUrl"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  label="Tel URL"
                  placeholder="tel:+1234567890"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Inbound Application Selection Field */}
        <FormField
          control={form.control}
          name="appRef"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select
                  label="Select Inbound Application"
                  options={applications.map(({ ref, name }) => ({
                    value: ref,
                    label: name
                  }))}
                  disabled={isApplicationLoading || applications.length === 0}
                  placeholder={
                    isApplicationLoading
                      ? "Loading applications..."
                      : applications.length === 0
                        ? "No applications found. Please create an application first."
                        : "Select application"
                  }
                  allowClear={true}
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
