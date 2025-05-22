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
import { useCallback } from "react";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { Select } from "~/core/components/design-system/ui/select/select";

const timezones = [
  { value: "UTC", label: "UTC" },
  { value: "PST: UTC-8:00", label: "PST: UTC-8:00" },
  { value: "EST: UTC-5:00", label: "EST: UTC-5:00" }
];

export const schema = z.object({
  name: z.string(),
  timezone: z.string(),
  worspaceId: z.string()
});

export const resolver = zodResolver(schema);

export type Schema = z.infer<typeof schema>;

export interface InviteMemberFormProps extends React.PropsWithChildren {}

export function WorkspaceSettingsForm() {
  const form = useForm<Schema>({
    resolver,
    defaultValues: {
      name: "",
      timezone: "UTC",
      worspaceId: ""
    },
    mode: "onChange"
  });

  const onSubmit = useCallback(
    async (data: Schema) => {
      console.log("Form submitted", data);
      toast("Ahoy! Invite sent successfully");
    },
    [form]
  );

  const { isValid, isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  label="Workspace Name"
                  supportingText="Please enter your full name"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select label="Timezone" options={timezones} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </FormRoot>
    </Form>
  );
}
