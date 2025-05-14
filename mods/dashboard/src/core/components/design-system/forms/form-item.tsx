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
import { forwardRef, useId } from "react";
import { FormItemContext } from "./form.context";
import { Box } from "@mui/material";

/**
 * Form Item
 *
 * @description A form item is a component that provides the necessary context
 * for the form elements within it to be accessible.
 */
const FormItem = forwardRef<
  HTMLFieldSetElement,
  React.HTMLAttributes<HTMLFieldSetElement>
>((props, ref) => {
  const id = useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <Box
        component="fieldset"
        ref={ref}
        id={id}
        role="group"
        {...props}
        sx={{
          display: "flex",
          flexDirection: "column",
          padding: 0,
          margin: 0,
          border: "none"
        }}
      />
    </FormItemContext.Provider>
  );
});

FormItem.displayName = "FormItem";

export { FormItem };
