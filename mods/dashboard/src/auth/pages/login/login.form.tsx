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
import { type UseFormReturn } from "react-hook-form";
import type { Schema } from "./login.page";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "~/core/components/design-system/forms";
import { Input } from "~/core/components/design-system/ui/input/input";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { LoginFormActions } from "./login.actions";

export interface LoginFormProps extends React.PropsWithChildren {
  form: UseFormReturn<Schema>;
  onSubmit: (data: Schema) => Promise<void>;
  onGithubAuth: () => Promise<void>;
}

export function LoginForm({ form, onSubmit, onGithubAuth }: LoginFormProps) {
  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
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
