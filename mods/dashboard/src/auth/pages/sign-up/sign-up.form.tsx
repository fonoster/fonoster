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
import type { Schema } from "./sign-up.page";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "~/core/components/design-system/forms";
import { Input } from "~/core/components/design-system/ui/input/input";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { SignupFormActions } from "./sign-up.actions";
import { AgreeTermsModal } from "~/auth/components/agree-terms-modal";
import { useEffect, useState } from "react";
import { Checkbox } from "~/core/components/design-system/ui/checkbox/checkbox";
import { Box } from "@mui/material";

export interface SignupFormProps extends React.PropsWithChildren {
  form: UseFormReturn<Schema>;
  onSubmit: (data: Schema) => Promise<void>;
  onGithubAuth: () => Promise<void>;
}

export function SignupForm({ form, onSubmit, onGithubAuth }: SignupFormProps) {
  const [isAgreeTermsModalOpen, setIsAgreeTermsModalOpen] = useState(false);

  const watchAgreeToTerms = form.watch("agreeToTerms");

  useEffect(() => {
    if (watchAgreeToTerms) {
      setIsAgreeTermsModalOpen(true);
    }
  }, [watchAgreeToTerms]);

  return (
    <>
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
                    label="Name"
                    supportingText="Please enter your name"
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    label="Password"
                    supportingText="8+ characters with upper, lower, number, and symbol."
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    label="Confirm Password"
                    supportingText="8+ characters with upper, lower, number, and symbol."
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Box textAlign="center">
                    <Checkbox {...field}>
                      Agree to the terms and conditions
                    </Checkbox>
                  </Box>
                </FormControl>
              </FormItem>
            )}
          />

          <SignupFormActions {...{ form, onGithubAuth }} />
        </FormRoot>
      </Form>
      <AgreeTermsModal
        isOpen={isAgreeTermsModalOpen}
        setIsOpen={setIsAgreeTermsModalOpen}
      />
    </>
  );
}
