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
import { useCallback } from "react";
import { Transport } from "@fonoster/types";
import { Checkbox } from "~/core/components/design-system/ui/checkbox/checkbox";

/**
 * Zod validation schema for the Create/Edit Domain Rule form.
 *
 * Ensures:
 * - A human-friendly name is required.
 * - The type is either "allow" or "deny".
 */
export const schema = z.object({
  host: z.string().nonempty("Host is required"),
  port: z.coerce.number().int().positive("Port must be a positive integer"),
  transport: z.nativeEnum(Transport),
  user: z.string().optional(),
  weight: z.coerce
    .number()
    .int()
    .nonnegative("Weight must be a non-negative integer"),
  priority: z.coerce
    .number()
    .int()
    .nonnegative("Priority must be a non-negative integer"),
  enabled: z.boolean()
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
 * Props interface for the CreateTrunkUrisModal component.
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
 * CreateTrunkUrisModal component.
 *
 * Renders a modal dialog containing a form to create a new Domain rule.
 * Uses React Hook Form for form state management and Zod for validation.
 *
 * When the form is submitted:
 * - Calls the onFormSubmit callback with the validated data.
 * - Closes the modal and resets the form state.
 *
 * @param {ModalProps} props - The component props controlling visibility and form behavior.
 * @returns {JSX.Element} The rendered modal containing the rule creation form.
 */
export const CreateTrunkUrisModal = ({
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
      host: "",
      port: 5060, // Default SIP port
      transport: Transport.TCP, // Default transport protocol
      user: "",
      weight: 10, // Default weight
      priority: 1, // Default priority
      enabled: true // Default to enabled
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
  const onSubmit = useCallback(
    (data: Schema) => {
      onFormSubmit(data);
      onClose(); // Close the modal
      setTimeout(() => {
        form.reset(); // Reset the form state after closing the modal
      }, 100); // Slight delay to ensure the modal is closed before resetting
    },
    [onFormSubmit, onClose, form]
  );

  return (
    <Modal open={isOpen} onClose={onClose} title="Create New Rule">
      <Form {...form}>
        <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="host"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="text" label="IP or Hostname" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="user"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="text" label="User" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="port"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="number" label="Port" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transport"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select
                    label="Transport"
                    options={Object.values(Transport).map((transport) => ({
                      value: transport,
                      label: transport
                    }))}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="number" label="Weight" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="number" label="Priority" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  >
                    Enable Outbound SIP URI
                  </Checkbox>
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
