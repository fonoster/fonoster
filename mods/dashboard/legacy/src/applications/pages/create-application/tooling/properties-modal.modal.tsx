/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Modal } from "~/core/components/design-system/ui/modal/modal";
import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "~/core/components/design-system/forms";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { Input } from "~/core/components/design-system/ui/input/input";
import { Select } from "~/core/components/design-system/ui/select/select";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Checkbox } from "~/core/components/design-system/ui/checkbox/checkbox";

const schema = z.object({
  key: z.string().nonempty(),
  type: z.enum(["string", "number"]),
  required: z.boolean().default(false),
  format: z.enum(["enum", "date-time"]).optional(),
  pattern: z.string().optional()
});

type Schema = z.infer<typeof schema>;

export interface PropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormSubmit: (data: Schema) => void;
  initialValues?: Partial<Schema>;
}

const TYPE_OPTIONS = [
  { value: "string", label: "string" },
  { value: "number", label: "number" }
];

const FORMAT_OPTIONS = [
  { value: "", label: "None" },
  { value: "enum", label: "Enum" },
  { value: "date-time", label: "Date Time" }
];

const DEFAULT_VALUES: Schema = {
  key: "",
  type: "string",
  required: false,
  format: undefined,
  pattern: undefined
};

export const PropertiesModal = ({
  isOpen,
  onClose,
  onFormSubmit,
  initialValues
}: PropertiesModalProps) => {
  const form = useForm<Schema>({
    resolver: zodResolver(schema) as any,
    mode: "onChange",
    defaultValues: DEFAULT_VALUES
  });

  const resetForm = useCallback(() => {
    form.reset(DEFAULT_VALUES);
  }, [form]);

  const resetFormWithInitialValues = useCallback(() => {
    if (initialValues) {
      form.reset({
        key: initialValues.key ?? "",
        type: (initialValues.type as any) ?? "string",
        required: initialValues.required ?? false,
        format: (initialValues.format as any) ?? undefined,
        pattern: initialValues.pattern ?? undefined
      });
    } else {
      resetForm();
    }
  }, [form, initialValues, resetForm]);

  useEffect(() => {
    if (isOpen) {
      resetFormWithInitialValues();
    }
  }, [isOpen, resetFormWithInitialValues]);

  const handleSubmit = useCallback(
    (data: Schema) => {
      onFormSubmit(data);
      resetForm();
    },
    [onFormSubmit, resetForm]
  );

  const onInnerSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit(handleSubmit as any)();
    },
    [form, handleSubmit]
  );

  const handleFormatChange = useCallback((value: string) => {
    return value === "" ? undefined : value;
  }, []);

  const renderKeyField = useCallback(
    () => (
      <FormField
        control={form.control}
        name="key"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input type="text" label="Key" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
    ),
    [form.control]
  );

  const renderTypeField = useCallback(
    () => (
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Select label="Type" options={TYPE_OPTIONS} {...field} />
            </FormControl>
          </FormItem>
        )}
      />
    ),
    [form.control]
  );

  const renderFormatField = useCallback(
    () => (
      <FormField
        control={form.control}
        name="format"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Select
                label="Format"
                options={FORMAT_OPTIONS}
                value={(field.value as any) ?? ""}
                onChange={(e) => {
                  const v = (e.target as HTMLInputElement).value;
                  field.onChange(handleFormatChange(v));
                }}
                allowClear={true}
              />
            </FormControl>
          </FormItem>
        )}
      />
    ),
    [form.control, handleFormatChange]
  );

  const renderPatternField = useCallback(
    () => (
      <FormField
        control={form.control}
        name="pattern"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input type="text" label="Pattern (regex)" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
    ),
    [form.control]
  );

  const renderRequiredField = useCallback(
    () => (
      <FormField
        control={form.control}
        name="required"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Checkbox
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              >
                Required
              </Checkbox>
            </FormControl>
          </FormItem>
        )}
      />
    ),
    [form.control]
  );

  return (
    <Modal open={isOpen} onClose={onClose} title="Add Parameter">
      <Form {...form}>
        <FormRoot onSubmit={onInnerSubmit}>
          {renderKeyField()}
          {renderTypeField()}
          {renderFormatField()}
          {renderPatternField()}
          {renderRequiredField()}

          <Button
            type="submit"
            isFullWidth
            size="small"
            disabled={!form.formState.isValid}
          >
            Save Parameter
          </Button>
        </FormRoot>
      </Form>
    </Modal>
  );
};
