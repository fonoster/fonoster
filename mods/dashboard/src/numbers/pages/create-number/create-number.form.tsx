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
import { Select } from "~/core/components/design-system/ui/select/select";
import {
  NUMBERS_DEFAULT_INITIAL_VALUES,
  COUNTRIES
} from "./create-number.const";
import { forwardRef, useImperativeHandle } from "react";
import { useApplications } from "~/applications/services/applications.service";
import { useTrunks } from "~/trunks/services/trunks.service";

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

/** Resolver to integrate Zod schema validation with React Hook Form. */
export const resolver = zodResolver(schema);

/** Type representing the validated data structure. */
export type Schema = z.infer<typeof schema>;

/**
 * Imperative handle interface exposing a submit method and validation state.
 *
 * Allows parent components to trigger form submission and to check if the submit button should be disabled.
 */
export interface CreateNumberFormHandle {
  submit: () => void;
  isSubmitDisabled?: boolean;
}

/**
 * Props interface for the CreateNumberForm component.
 */
export interface CreateNumberFormProps extends React.PropsWithChildren {
  /** Optional initial values to populate the form fields with. */
  initialValues?: Schema;
  /** Callback triggered on successful form submission. */
  onSubmit: (data: Schema) => Promise<void>;
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
 * - Imperative handle for exposing a submit method to parent components
 *
 * @param {CreateNumberFormProps} props - Props including onSubmit handler and optional initial values.
 * @param {React.Ref<CreateNumberFormHandle>} ref - Ref exposing submit functionality.
 * @returns {JSX.Element} The rendered Create Number form.
 */
export const CreateNumberForm = forwardRef<
  CreateNumberFormHandle,
  CreateNumberFormProps
>(({ onSubmit, initialValues }, ref) => {
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

  /** Exposes the submit method and submit state via the imperative handle. */
  useImperativeHandle(ref, () => ({
    submit: () => {
      form.handleSubmit(onSubmit)();
    },
    isSubmitDisabled: form.formState.isSubmitting || !form.formState.isValid
  }));

  /**
   * Renders the form with individual fields wrapped in FormField and FormItem components.
   */
  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
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
                        : ""
                  }
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
