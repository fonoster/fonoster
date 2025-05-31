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
import { Role } from "@fonoster/types";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "~/core/components/design-system/forms";
import { Input } from "~/core/components/design-system/ui/input/input";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { Box, styled } from "@mui/material";
import { Button } from "~/core/components/design-system/ui/button/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCallback } from "react";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { Select } from "~/core/components/design-system/ui/select/select";
import { Logger } from "~/core/logger";

export const schema = z.object({
  role: z.string().nonempty(),
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z.string().email()
});

export const resolver = zodResolver(schema);

export type Schema = z.infer<typeof schema>;

export interface InviteMemberFormProps extends React.PropsWithChildren {}

export function InviteMemberForm() {
  const form = useForm<Schema>({
    resolver,
    defaultValues: {
      name: "",
      email: "",
      role: "USER"
    },
    mode: "onChange"
  });

  const onSubmit = useCallback(
    async (data: Schema) => {
      Logger.debug("Form submitted", data);
      toast("Ahoy! Invite sent successfully");
    },
    [form]
  );

  const { isValid, isSubmitting } = form.formState;
  const isSubmitDisabled = !isValid || isSubmitting;

  const ROLE_OPTIONS = Object.entries(Role).map(([key, value]) => ({
    value: value,
    label: key
  }));

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select label="Role" options={ROLE_OPTIONS} {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  label="Name"
                  supportingText="Please enter your full name"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

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
        <ActionsRoot>
          <Button type="submit" disabled={isSubmitDisabled}>
            {isSubmitting ? "Loading..." : "Invite Member"}
          </Button>
        </ActionsRoot>
      </FormRoot>
    </Form>
  );
}

export const ActionsRoot = styled(Box)(() => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
}));
