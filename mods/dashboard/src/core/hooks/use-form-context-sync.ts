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

import { useEffect, useCallback, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFormContext } from "../contexts/form-context";

/**
 * Hook that synchronizes react-hook-form state with the form context
 * This allows components outside the form hierarchy to access form state
 */
export function useFormContextSync<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  onSubmit?: (data: T) => void,
  isEdit?: boolean
) {
  const { setFormState, setSubmitHandler } = useFormContext();

  // Function to update form state
  const updateFormState = useCallback(() => {
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

  // Track if this is the initial render
  const [isInitialized, setIsInitialized] = useState(false);

  // Handle initial dirty state for edit forms
  useEffect(() => {
    if (isEdit && !isInitialized && form.formState.isDirty) {
      // For edit forms, if form is dirty on first render, it's because of initialValues
      // We'll treat it as not dirty for the context
      setFormState({
        isValid: form.formState.isValid,
        isSubmitting: form.formState.isSubmitting,
        isDirty: false,
        hasErrors: Object.keys(form.formState.errors).length > 0
      });
      setIsInitialized(true);
    }
  }, [form.formState.isDirty, isInitialized, setFormState, isEdit]);

  // Sync form state with context
  useEffect(() => {
    // Subscribe to form value changes
    const valueSubscription = form.watch(updateFormState);

    return () => {
      valueSubscription.unsubscribe();
    };
  }, [form, updateFormState]);

  // Sync form state changes (isSubmitting, isValid, etc.)
  useEffect(() => {
    updateFormState();
  }, [updateFormState]);

  // Set submit handler
  const submitForm = useCallback(() => {
    if (onSubmit) {
      form.handleSubmit(onSubmit)();
    }
  }, [form, onSubmit]);

  useEffect(() => {
    setSubmitHandler(submitForm);
  }, [setSubmitHandler, submitForm]);

  return {
    submitForm
  };
}
