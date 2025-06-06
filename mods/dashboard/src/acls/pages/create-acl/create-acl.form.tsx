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
import { useFieldArray, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "~/core/components/design-system/forms";
import { Input } from "~/core/components/design-system/ui/input/input";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useImperativeHandle, useCallback, useState } from "react";
import { schema, type Schema } from "./create-acl.schema";
import { Select } from "~/core/components/design-system/ui/select/select";
import { Box } from "@mui/material";
import { CreateRuleModal } from "./create-acl-rules-modal.modal";
import { ModalTrigger } from "~/core/components/general/modal-trigger";

/**
 * Imperative handle interface.
 *
 * Exposes:
 * - submit(): triggers form submission programmatically.
 * - isSubmitDisabled: determines if the submit button should be disabled.
 */
export interface CreateAclFormHandle {
  submit: () => void;
  reset: () => void;
  isSubmitDisabled?: boolean;
}

/**
 * Props interface for the CreateAclForm component.
 *
 * @property {Schema} [initialValues] - Optional initial values for editing.
 * @property {(data: Schema) => Promise<void>} onSubmit - Callback triggered on form submission.
 */
export interface CreateAclFormProps extends React.PropsWithChildren {
  initialValues?: Schema;
  onSubmit: (data: Schema) => Promise<void>;
}

/**
 * CreateAclForm component.
 *
 * Renders a form for creating or editing an ACL (Access Control List) entry, including:
 * - A friendly name.
 * - A unified Select showing all rules (allow/deny) with their type prefixes.
 * - A ModalTrigger for adding new rules.
 *
 * Integrates:
 * - React Hook Form for state management.
 * - Zod for schema validation.
 * - FieldArray for managing dynamic rules.
 * - Modal integration for rule creation.
 *
 * @param {CreateAclFormProps} props - Props including the onSubmit handler and optional initial values.
 * @param {React.Ref<CreateAclFormHandle>} ref - Exposes imperative form submission.
 */
export const CreateAclForm = forwardRef<
  CreateAclFormHandle,
  CreateAclFormProps
>(({ onSubmit, initialValues }, ref) => {
  /** Local state controlling the visibility of the rules modal. */
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  /** Initializes React Hook Form with Zod resolver and initial values. */
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      ref: null,
      name: "",
      rules: [],
      ...initialValues
    },
    mode: "onChange"
  });

  /** React Hook Form's useFieldArray for dynamic list of rules. */
  const { fields, remove, append } = useFieldArray({
    control: form.control,
    name: "rules"
  });

  /** Exposes imperative submission and disables submit when invalid or submitting. */
  useImperativeHandle(ref, () => ({
    submit: () => form.handleSubmit(onSubmit)(),
    reset: () => form.reset(),
    isSubmitDisabled: !form.formState.isValid || form.formState.isSubmitting
  }));

  /**
   * Handles deletions from the Select component.
   *
   * @param {string[]} oldValues - The currently displayed values in the Select.
   * @param {string[]} newValues - The new values after deletion.
   */
  const handleDelete = useCallback(
    (oldValues: string[], newValues: string[]) => {
      const deleted = oldValues.find((val) => !newValues.includes(val));
      if (deleted) {
        const index = fields.findIndex(
          (item) => `${item.type}:${item.name}` === deleted
        );
        if (index !== -1) {
          remove(index);
        }
      }
    },
    [fields, remove]
  );

  /**
   * Builds the displayed values for the Select, each formatted as "type:name".
   */
  const selectValues = fields.map((item) => `${item.type}:${item.name}`);

  /**
   * Builds the Select options, matching the Select values.
   */
  const selectOptions = selectValues.map((val) => ({
    value: val,
    label: val
  }));

  return (
    <>
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

          {/* Unified Rules Select Field */}
          <FormField
            control={form.control}
            name="rules"
            render={() => (
              <FormItem>
                <FormControl>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}
                  >
                    {/* Read-only Select showing current rules */}
                    <Select
                      label="Network Rules"
                      placeholder="Click below to add rules (e.g., allow:xxx, deny:xxx)."
                      multiple
                      value={selectValues}
                      options={selectOptions}
                      disabled
                      onChange={(event) => {
                        const newValues = event.target.value as string[];
                        handleDelete(selectValues, newValues);
                      }}
                    />

                    {/* Modal trigger to open rule creation */}
                    <ModalTrigger
                      onClick={() => setIsRulesModalOpen(true)}
                      label="Add Rule"
                    />
                  </Box>
                </FormControl>
              </FormItem>
            )}
          />
        </FormRoot>
      </Form>

      {/* Modal for creating new ACL rules */}
      <CreateRuleModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        onFormSubmit={(rule) => {
          append(rule);
          setIsRulesModalOpen(false);
        }}
      />
    </>
  );
});
