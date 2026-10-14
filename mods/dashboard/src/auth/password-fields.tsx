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
import type { UseFormReturn } from "react-hook-form";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { authInput } from "./auth-layout";

type PasswordPair = { password: string; confirm: string };

/** "New password" and "Confirm password", shared by reset, invite and sign-up. */
export function NewPasswordFields<T extends PasswordPair>({
  form
}: {
  form: UseFormReturn<T>;
}) {
  const f = form as unknown as UseFormReturn<PasswordPair>;
  const { errors } = f.formState;
  return (
    <>
      <Field
        label="New password"
        error={errors.password?.message}
        hint="At least 8 characters."
      >
        {(a11y) => (
          <Input
            {...a11y}
            {...f.register("password")}
            type="password"
            autoComplete="new-password"
            className={authInput}
          />
        )}
      </Field>
      <Field label="Confirm password" error={errors.confirm?.message}>
        {(a11y) => (
          <Input
            {...a11y}
            {...f.register("confirm")}
            type="password"
            autoComplete="new-password"
            className={authInput}
          />
        )}
      </Field>
    </>
  );
}
