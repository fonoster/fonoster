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
import { Modal } from "~/core/components/design-system/ui/modal/modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "~/core/components/design-system/forms";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { Input } from "~/core/components/design-system/ui/input/input";
import { Select } from "~/core/components/design-system/ui/select/select";
import { z } from "zod";
import { Button } from "~/core/components/design-system/ui/button/button";

/**
 * Zod validation schema for the Create/Edit ACL Rule form.
 *
 * Ensures:
 * - A human-friendly name is required.
 * - The type is either "allow" or "deny".
 */
export const schema = z.object({
  /**
   * IP or CIDR range of the rule.
   *
   * Required; cannot be empty.
   */
  name: z.string().nonempty("IP or CIDR is required"),

  /**
   * Type of the rule (allow or deny).
   *
   * Required; must be either "allow" or "deny".
   */
  type: z.enum(["allow", "deny"])
});

/**
 * Resolver to integrate Zod schema validation with React Hook Form.
 */
export const resolver = zodResolver(schema);

/**
 * Type representing the validated data structure for the form.
 *
 * This type helps with strong typing in the form state, handlers, and submissions.
 */
export type Schema = z.infer<typeof schema>;

/**
 * Props interface for the CreateRuleModal component.
 *
 * @property {boolean} isOpen - Controls the visibility of the modal.
 * @property {() => void} onClose - Function to close the modal.
 * @property {(data: Schema) => void} onFormSubmit - Function triggered when the form is successfully submitted.
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormSubmit: (data: Schema) => void;
}

/**
 * CreateRuleModal component.
 *
 * Renders a modal dialog containing a form to create a new ACL rule.
 * Uses React Hook Form for form state management and Zod for validation.
 *
 * When the form is submitted:
 * - Calls the onFormSubmit callback with the validated data.
 * - Closes the modal and resets the form state.
 *
 * @param {ModalProps} props - The component props controlling visibility and form behavior.
 * @returns {JSX.Element} The rendered modal containing the rule creation form.
 */
export const CreateRuleModal = ({
  isOpen,
  onClose,
  onFormSubmit
}: ModalProps) => {
  /**
   * Initializes React Hook Form with Zod validation and default values.
   */
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "allow"
    },
    mode: "onChange"
  });

  /**
   * Handles the form submission.
   *
   * Calls the parent-provided onFormSubmit function with the validated data,
   * closes the modal, and resets the form after a short delay to avoid visual flicker.
   *
   * @param {Schema} data - The validated form data.
   */
  const onSubmit = (data: Schema) => {
    onFormSubmit(data);
    onClose(); // Close the modal
    setTimeout(() => {
      form.reset(); // Reset the form state after closing the modal
    }, 100); // Slight delay to ensure the modal is closed before resetting
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Create New Rule">
      <Form {...form}>
        <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
          {/* IP or CIDR Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="text"
                    label="IP or CIDR"
                    placeholder="0.0.0.0/0"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Rule Type Field */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select
                    label="Category"
                    options={[
                      { value: "allow", label: "Allow" },
                      { value: "deny", label: "Deny" }
                    ]}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button type="submit">Save</Button>
        </FormRoot>
      </Form>
    </Modal>
  );
};
