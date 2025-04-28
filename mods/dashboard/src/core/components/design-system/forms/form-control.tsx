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
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef
} from "react";
import { useFormField } from "./form.context";

type Props = ComponentPropsWithoutRef<"div"> & {
  isError?: boolean;
};

type Attributes = ComponentRef<"div">;

/**
 * Form Control
 *
 * @description A form control is a component that wraps a form element and provides
 * the necessary attributes and context for the form element to be accessible.
 */
const FormControl = forwardRef<Attributes, Props>(({ ...props }, ref) => {
  const { error, formItemId, formHelpId, formMessageId } = useFormField();

  return (
    <div
      ref={ref}
      id={formItemId}
      aria-describedby={!error ? formHelpId : `${formHelpId} ${formMessageId}`}
      aria-invalid={Boolean(error)}
      data-state={error ? "invalid" : "valid"}
      {...props}
    />
  );
});

FormControl.displayName = "FormControl";

export { FormControl };
