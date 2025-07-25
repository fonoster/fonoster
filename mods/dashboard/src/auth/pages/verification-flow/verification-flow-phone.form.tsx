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
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "~/core/components/design-system/forms";
import { Input } from "~/core/components/design-system/ui/input/input";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { Button } from "~/core/components/design-system/ui/button/button";

export const schema = z.object({
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\+?\d{10,15}$/, "Enter a valid phone number")
});

export const resolver = zodResolver(schema);
export type Schema = z.infer<typeof schema>;
export type Form = UseFormReturn<Schema>;

export interface VerificationFlowPhoneProps extends React.PropsWithChildren {
  onSubmit: (data: Schema, form: Form) => Promise<void>;
}

export function VerificationFlowPhone({
  onSubmit
}: VerificationFlowPhoneProps) {
  const form = useForm<Schema>({
    resolver,
    defaultValues: { phoneNumber: "" },
    mode: "onChange"
  });

  const onSubmitForm = useCallback(
    async (data: Schema) => onSubmit(data, form),
    [onSubmit, form]
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmitForm)}>
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="tel"
                  label="Phone Number"
                  supportingText="Please enter your phone number (e.g. +1234567890)"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting || !form.formState.isValid}
          isFullWidth
        >
          Send Code
        </Button>
      </FormRoot>
    </Form>
  );
}
