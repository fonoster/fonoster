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
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { Link } from "~/core/components/general/link/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";

export const schema = z.object({ email: z.string().email() });

export const resolver = zodResolver(schema);
export type Schema = z.infer<typeof schema>;
export type Form = UseFormReturn<Schema>;

export interface ForgotPasswordFormProps extends React.PropsWithChildren {
  onSubmit: (data: Schema, form: Form) => Promise<void>;
}

export function ForgotPasswordForm({ onSubmit }: ForgotPasswordFormProps) {
  const form = useForm<Schema>({
    resolver,
    defaultValues: {
      email: ""
    },
    mode: "onChange"
  });

  const onSubmitForm = useCallback(
    async (data: Schema) => onSubmit(data, form),
    [onSubmit, form]
  );

  const { isValid, isSubmitting } = form.formState;
  const isSubmitDisabled = !isValid || isSubmitting;

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

        <ActionsRoot>
          <Button type="submit" isFullWidth disabled={isSubmitDisabled}>
            {isSubmitting ? "Sending..." : "Send me a reset link"}
          </Button>

          <Link to="/auth/login">
            <Typography variant="body-small" color="base.03">
              Back to Sign In
            </Typography>
          </Link>
        </ActionsRoot>
      </FormRoot>
    </Form>
  );
}

export const ActionsRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  textAlign: "center",
  marginTop: theme.spacing(2)
}));
