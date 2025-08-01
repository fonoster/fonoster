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

import {
  FormField,
  FormControl,
  FormItem
} from "~/core/components/design-system/forms";
import { Input } from "~/core/components/design-system/ui/input/input";
import { Select } from "~/core/components/design-system/ui/select/select";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { APPLICATION_TYPES } from "../create-application.const";
import type { Control } from "react-hook-form";
import type { Schema } from "../schemas/application-schema";
import { Box } from "@mui/material";

export const GeneralSection = ({
  control,
  isAutopilot,
  isEdit
}: {
  control: Control<Schema>;
  isAutopilot: boolean;
  isEdit?: boolean;
}) => (
  <>
    <FormField
      control={control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type="text" label="Friendly Name" {...field} />
          </FormControl>
        </FormItem>
      )}
    />

    {!isEdit && (
      <FormField
        control={control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Select
                label="Application Type"
                options={APPLICATION_TYPES}
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
    )}

    <FormField
      control={control}
      name="endpoint"
      rules={{ required: !isAutopilot }}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input
              type="text"
              label="Application Endpoint"
              placeholder="your-app.com:50051"
              supportingText="This is your application's endpoint. You only need to specify it for External applications or when running your own instance of the Autopilot service."
              {...field}
            />
          </FormControl>
        </FormItem>
      )}
    />
  </>
);
