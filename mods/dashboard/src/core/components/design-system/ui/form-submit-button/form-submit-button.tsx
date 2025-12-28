/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Button } from "../button/button";
import { useFormContext } from "~/core/contexts/form-context";
import type { ButtonAttributes } from "../button/button.styles";

export interface FormSubmitButtonProps extends Omit<
  ButtonAttributes,
  "onClick" | "disabled"
> {
  children?: React.ReactNode;
  loadingText?: string;
  disabledText?: string;
  /**
   * When false, the button will not require the form to be dirty to enable submission.
   * Defaults to true to preserve current behavior.
   */
  requireDirty?: boolean;
}

export function FormSubmitButton({
  children = "Save",
  loadingText = "Saving...",
  disabledText,
  requireDirty = true,
  ...buttonProps
}: FormSubmitButtonProps) {
  const { formState, submitForm } = useFormContext();

  // Disable if form is invalid, submitting, has errors, or has no changes
  const isDisabled =
    !formState.isValid ||
    formState.isSubmitting ||
    formState.hasErrors ||
    (requireDirty && !formState.isDirty);

  const buttonText = formState.isSubmitting
    ? loadingText
    : isDisabled && disabledText
      ? disabledText
      : children;

  return (
    <Button {...buttonProps} onClick={submitForm} disabled={isDisabled}>
      {buttonText}
    </Button>
  );
}
