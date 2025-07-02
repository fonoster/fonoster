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

import { Box } from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import {
  FormField,
  FormControl,
  FormItem
} from "~/core/components/design-system/forms";
import { Input } from "~/core/components/design-system/ui/input/input";
import type { Control } from "react-hook-form";
import type { Schema } from "../schemas/application-schema";
import { Textarea } from "~/core/components/design-system/ui/textarea/textarea";

export const ConversationSettingsSection = ({
  control
}: {
  control: Control<Schema>;
  isAutopilot: boolean;
}) => (
  <>
    <Box sx={{ mt: "8px" }}>
      <Typography variant="mono-medium" color="base.03">
        Conversation Settings
      </Typography>
      <Typography variant="body-micro" color="base.03">
        Use these settings to configure the conversation with your customers.
        All the parameters will be available to the context of the conversation.
      </Typography>
    </Box>

    <FormField
      control={control}
      name="intelligence.config.conversationSettings.firstMessage"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type="text" label="First Message" {...field} />
          </FormControl>
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="intelligence.config.conversationSettings.systemPrompt"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Textarea
              label="System Prompt"
              minRows={20}
              placeholder="Add your system prompt here"
              {...field}
            />
          </FormControl>
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="intelligence.config.conversationSettings.goodbyeMessage"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type="text" label="Goodbye Message" {...field} />
          </FormControl>
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="intelligence.config.conversationSettings.systemErrorMessage"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type="text" label="System Error Message" {...field} />
          </FormControl>
        </FormItem>
      )}
    />
  </>
);
