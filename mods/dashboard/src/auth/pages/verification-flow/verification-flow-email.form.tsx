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
import { useFonoster } from "~/core/sdk/hooks/use-fonoster";
import { useCurrentUser } from "~/auth/hooks/use-current-user";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "~/core/components/design-system/forms";
import { Input } from "~/core/components/design-system/ui/input/input";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { Button } from "~/core/components/design-system/ui/button/button";
import { ContactType } from "@fonoster/types";
import { getErrorMessage } from "~/core/helpers/extract-error-message";

/**
 * Zod validation schema for the login form.
 * Validates that:
 *  - email is a valid email address.
 *  - password has at least 8 characters.
 */
export const schema = z.object({
  code: z.string().nonempty("Verification code is required"),
  email: z.string().email("Invalid email address").nonempty("Email is required")
});

/**
 * Hook-form resolver using Zod for validation.
 */
export const resolver = zodResolver(schema);

/**
 * Type representing the validated schema.
 */
export type Schema = z.infer<typeof schema>;

/**
 * Type representing the hook-form return object.
 */
export type Form = UseFormReturn<Schema>;

/**
 * Props interface for the VerificationFlowEmail component.
 */
export interface VerificationFlowEmailProps extends React.PropsWithChildren {
  resendSlot?: React.ReactNode;
  onSuccess?: () => void;
}

/**
 * VerificationFlowEmail component.
 * Renders the email and password fields, handles validation, and manages submission logic.
 * Integrates GitHub authentication and disables the submit button while submitting or when invalid.
 *
 * @param onSubmit - Function to handle form submission.
 * @param onGithubAuth - Function to handle GitHub authentication.
 */
export function VerificationFlowEmail({
  resendSlot,
  onSuccess,
  onSendCode
}: VerificationFlowEmailProps & { onSendCode?: () => void }) {
  const [codeSent, setCodeSent] = useState(false);
  /** Initializes react-hook-form with validation resolver and default values. */
  const form = useForm<Schema>({
    resolver,
    defaultValues: {
      code: "",
      email: ""
    },
    mode: "onChange"
  });
  const { client } = useFonoster();
  const { user } = useCurrentUser();

  // Send verification code
  const handleSendCode = async () => {
    if (!user?.email) return;
    try {
      await client.sendVerificationCode(ContactType.EMAIL, user.email);
      toast("Verification code sent to your email");
      setCodeSent(true);
      onSendCode?.(); // Trigger timer in parent
    } catch (e) {
      toast("Error sending code to email");
    }
  };

  /**
   * Memoized submit handler that passes the validated data to the onSubmit prop.
   */
  const onSubmitForm = useCallback(
    async (data: Schema) => {
      try {
        await client.verifyCode({
          username: user?.email ?? "",
          contactType: ContactType.EMAIL,
          value: user?.email ?? "",
          verificationCode: data.code
        });
        toast("Email verified!");
        onSuccess?.();
      } catch (e) {
        toast("Invalid code or error verifying email");
      }
    },
    [client, user, onSuccess]
  );

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmitForm)}>
        {!codeSent ? (
          <>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="email"
                      label="Email Address"
                      supportingText="This is the email address you used to sign up"
                      value={user?.email || ""}
                      disabled
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="button" onClick={handleSendCode} isFullWidth>
              Send Code
            </Button>
          </>
        ) : (
          <>
            {/* Email field */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="text"
                      label="Verification Code"
                      supportingText="Please enter your verification code"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {/* Submit button */}
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !form.formState.isValid}
              isFullWidth
            >
              Verify Email Address
            </Button>
            {/* Resend/timer slot */}
            {codeSent && resendSlot && (
              <div style={{ marginTop: 16 }}>{resendSlot}</div>
            )}
          </>
        )}
      </FormRoot>
    </Form>
  );
}
