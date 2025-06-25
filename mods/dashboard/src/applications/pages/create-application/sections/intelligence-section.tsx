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

export const IntelligenceSection = ({
  control
}: {
  control: Control<Schema>;
}) => (
  <>
    <Box sx={{ mt: "8px" }}>
      <Typography variant="mono-medium" color="base.03">
        INTELLIGENCE
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
            <Input type="text" label="First Message (optional)" {...field} />
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
            <Textarea label="System Prompt" minRows={20} {...field} />
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
    {/* transferOptions (objeto opcional) */}
    <Box sx={{ mt: "8px" }}>
      <Typography variant="mono-medium" color="base.03">
        Transfer Options
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
      name="intelligence.config.conversationSettings.transferOptions.phoneNumber"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type="text" label="Phone Number" {...field} />
          </FormControl>
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="intelligence.config.conversationSettings.transferOptions.message"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type="text" label="Message" {...field} />
          </FormControl>
        </FormItem>
      )}
    />
    {/* idleOptions (objeto requerido) */}
    <Box sx={{ mt: "8px" }}>
      <Typography variant="mono-medium" color="base.03">
        Idle Options
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
      name="intelligence.config.conversationSettings.idleOptions.message"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type="text" label="Idle Message" {...field} />
          </FormControl>
        </FormItem>
      )}
    />
    {/* Configuración de languageModel */}

    <Box sx={{ mt: "8px" }}>
      <Typography variant="mono-medium" color="base.03">
        Language Model
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
      name="intelligence.config.languageModel.provider"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type="text" label="Provider" {...field} />
          </FormControl>
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="intelligence.config.languageModel.model"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type="text" label="Model" {...field} />
          </FormControl>
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="intelligence.config.languageModel.temperature"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type="number" label="Temperature" {...field} />
          </FormControl>
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="intelligence.config.languageModel.maxTokens"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type="number" label="Max Tokens" {...field} />
          </FormControl>
        </FormItem>
      )}
    />

    {/* Configuración de eventsHook */}
    <Box sx={{ mt: "8px" }}>
      <Typography variant="mono-medium" color="base.03">
        Events Hook
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
      name="intelligence.config.eventsHook.url"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type="text" label="Events Hook URL" {...field} />
          </FormControl>
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="intelligence.config.eventsHook.headers"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type="text" label="Headers (JSON, optional)" {...field} />
          </FormControl>
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="intelligence.config.eventsHook.events"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type="text" label="Events (comma separated)" {...field} />
          </FormControl>
        </FormItem>
      )}
    />
  </>
);
