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
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { schema, type Schema } from "./create-secret.schema";
import { Select } from "~/core/components/design-system/ui/select/select";
import { JsonViewer } from "~/core/components/general/json-viewer";
import { Textarea } from "~/core/components/design-system/ui/textarea/textarea";
import { useJsonDetection } from "~/core/hooks/use-json-detection";
import { JsonPreviewToggle } from "./json-preview-toggle.form";

/**
 * Interface defining the imperative handle for CreateSecretForm.
 *
 * Exposes:
 * - submit(): Triggers form submission programmatically.
 * - isSubmitDisabled: Boolean flag to disable the submit button if validation fails or is pending.
 */
export interface CreateSecretFormHandle {
  submit: () => void;
  isSubmitDisabled?: boolean;
}

/**
 * Props interface for the CreateSecretForm component.
 */
export interface CreateSecretFormProps extends React.PropsWithChildren {
  /** Optional initial values to populate the form fields with. */
  initialValues?: Schema;
  /** Callback triggered on successful form submission. */
  onSubmit: (data: Schema) => Promise<void>;
}

/**
 * CreateSecretForm component.
 *
 * Renders a form for creating or editing a secret, including fields for:
 * - Friendly Name
 * - Secret Type (text or JSON)
 * - Secret Value (with JSON preview support)
 *
 * Integrates:
 * - React Hook Form for state management and validation.
 * - Zod for schema validation.
 * - Imperative handle to expose submit functionality to parent components.
 *
 * @param {CreateSecretFormProps} props - Props including onSubmit handler and optional initial values.
 * @param {React.Ref<CreateSecretFormHandle>} ref - Ref exposing submit functionality.
 * @returns {JSX.Element} The rendered Create Secret form.
 */
export const CreateSecretForm = forwardRef<
  CreateSecretFormHandle,
  CreateSecretFormProps
>(({ onSubmit, initialValues }, ref) => {
  /** State to toggle JSON preview visibility. */
  const [isPreview, setIsPreview] = useState(false);

  /** Initializes the form with Zod validation and default values. */
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      ref: null,
      name: "",
      secret: "",
      type: "text"
    },
    mode: "onChange"
  });

  /**
   * Exposes imperative methods to parent components:
   * - submit(): triggers form submission.
   * - isSubmitDisabled: disables submit when invalid or submitting.
   */
  useImperativeHandle(ref, () => ({
    submit: () => form.handleSubmit(onSubmit)(),
    isSubmitDisabled: !form.formState.isValid || form.formState.isSubmitting
  }));

  /** Utility function from custom hook to detect if a value is JSON. */
  const isJsonValue = useJsonDetection();

  /** Watches current form values for secret and type fields. */
  const json = form.watch("secret");
  const type = form.watch("type");

  /**
   * Effect to set the default secret type based on the initial value.
   * If the secret looks like JSON, automatically select the JSON type.
   */
  useEffect(() => {
    if (initialValues?.secret) {
      const isJson = isJsonValue(initialValues.secret);
      form.setValue("type", isJson ? "json" : "text");
    }
  }, [initialValues, isJsonValue, form]);

  /**
   * Renders the Create Secret form with fields for name, type, and secret value,
   * including a JSON preview toggle and conditional JSON viewer.
   */
  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        {/* Secret Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  label="Secret Name"
                  placeholder="(e.g. GOOGLE_SERVICE_ACCOUNT)"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Secret Type Selector */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select
                  label="Secret Type"
                  options={[
                    { label: "Text", value: "text" },
                    { label: "JSON", value: "json" }
                  ]}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Secret Value Field */}
        <FormField
          control={form.control}
          name="secret"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                {type === "text" ? (
                  <Input type="password" label="Secret Value" {...field} />
                ) : (
                  <Textarea
                    label="Secret Value"
                    placeholder='(e.g. {"key": "value"})'
                    minRows={6}
                    {...field}
                  />
                )}
              </FormControl>

              {/* JSON Preview Toggle */}
              <JsonPreviewToggle
                checked={isPreview}
                onChange={setIsPreview}
                disabled={type !== "json"}
              />
            </FormItem>
          )}
        />

        {/* JSON Preview */}
        {type === "json" && isPreview && (
          <JsonViewer data={isJsonValue(json) ? JSON.parse(json) : {}} />
        )}
      </FormRoot>
    </Form>
  );
});
