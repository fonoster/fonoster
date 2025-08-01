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
        Outgoing traffic from your communications infrastructure to the PSTN. In
        order to use a Trunk for termination it must have a Termination SIP URI
        and at least one authentication scheme (IP Access Control Lists and/or
        Credential Lists).
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
              placeholder="Add markdown formatted system prompt here"
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
