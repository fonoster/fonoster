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

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode
} from "react";

export interface FormState {
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  hasErrors: boolean;
}

interface FormContextValue {
  formState: FormState;
  setFormState: (state: Partial<FormState>) => void;
  resetFormState: () => void;
  submitForm: () => void;
  setSubmitHandler: (handler: () => void) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

const initialFormState: FormState = {
  isValid: false,
  isSubmitting: false,
  isDirty: false,
  hasErrors: false
};

interface FormProviderProps {
  children: ReactNode;
}

export function FormProvider({ children }: FormProviderProps) {
  const [formState, setFormStateState] = useState<FormState>(initialFormState);
  const [submitHandler, setSubmitHandlerState] = useState<(() => void) | null>(
    null
  );

  const setFormState = useCallback((newState: Partial<FormState>) => {
    setFormStateState((prev) => ({ ...prev, ...newState }));
  }, []);

  const resetFormState = useCallback(() => {
    setFormStateState(initialFormState);
    setSubmitHandlerState(null);
  }, []);

  const submitForm = useCallback(() => {
    if (submitHandler) {
      submitHandler();
    }
  }, [submitHandler]);

  const setSubmitHandler = useCallback((handler: () => void) => {
    setSubmitHandlerState(() => handler);
  }, []);

  const value: FormContextValue = {
    formState,
    setFormState,
    resetFormState,
    submitForm,
    setSubmitHandler
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
}
