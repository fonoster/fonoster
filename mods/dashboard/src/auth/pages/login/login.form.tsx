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
import { LoginFormActions } from "./login.actions";

export const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const resolver = zodResolver(schema);
export type Schema = z.infer<typeof schema>;
export type Form = UseFormReturn<Schema>;

export interface LoginFormProps extends React.PropsWithChildren {
  onSubmit: (data: Schema, form: Form) => Promise<void>;
  onGithubAuth: () => Promise<void>;
}

export function LoginForm({ onSubmit, onGithubAuth }: LoginFormProps) {
  const form = useForm<Schema>({
    resolver,
    defaultValues: {
      email: "",
      password: ""
    },
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="email"
                  label="Email Address"
                  supportingText="Please enter your email address"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="password"
                  label="Password"
                  supportingText="Please enter your password"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <LoginFormActions {...{ form, onGithubAuth }} />
      </FormRoot>
    </Form>
  );
}
