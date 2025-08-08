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

import { useEffect, useCallback, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFormContext } from "../contexts/form-context";

/**
 * Hook that synchronizes react-hook-form state with the form context
 * This allows components outside the form hierarchy to access form state
 */
export function useFormContextSync<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  onSubmit?: (data: T) => void,
  _isEdit?: boolean
) {
  const { setFormState, setSubmitHandler } = useFormContext();

  // Use refs to stabilize the callbacks
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  // Set submit handler
  const submitForm = useCallback(() => {
    if (onSubmitRef.current) {
      form.handleSubmit(onSubmitRef.current)();
    }
  }, [form]);

  // Initialize submit handler on mount
  useEffect(() => {
    setSubmitHandler(submitForm);
  }, [submitForm, setSubmitHandler]);

  // Update form state whenever form state changes
  useEffect(() => {
    setFormState({
      isValid: form.formState.isValid,
      isSubmitting: form.formState.isSubmitting,
      isDirty: form.formState.isDirty,
      hasErrors: Object.keys(form.formState.errors).length > 0
    });
  }, [
    form.formState.isValid,
    form.formState.isSubmitting,
    form.formState.isDirty,
    form.formState.errors,
    setFormState
  ]);

  return {
    submitForm
  };
}
