/*
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
import { createContext, useContext } from "react";
import type { FieldPath, FieldValues } from "react-hook-form";
import { useFormContext } from "react-hook-form";

export interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
}

export interface FormItemContextValue {
  id: string;
}

export const FormFieldContext = createContext<FormFieldContextValue>({
  name: ""
});

export const FormItemContext = createContext<FormItemContextValue>({
  id: ""
});

/**
 * Form field hook
 *
 * @description This hook is used to get the form field state and the form context.
 */
export const useFormField = () => {
  const { name } = useContext(FormFieldContext);
  const { id } = useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(name, formState);

  if (!name) {
    throw new Error("useFormField() should be used within <FormField />");
  }

  return {
    id,
    name,
    formItemId: `${id}-form-item`,
    formHelpId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState
  };
};
