import { Box } from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import {
  FormField,
  FormControl,
  FormItem
} from "~/core/components/design-system/forms";
import { Input } from "~/core/components/design-system/ui/input/input";
import { Select } from "~/core/components/design-system/ui/select/select";
import { TTS_VENDORS, TTS_VOICES } from "../create-application.const";
import type { Control } from "react-hook-form";
import type { Schema } from "../schemas/application-schema";

export const TTSSection = ({
  control,
  isAutopilot
}: {
  control: Control<Schema>;
  isAutopilot: boolean;
}) => (
  <>
    <Box sx={{ mt: "8px" }}>
      <Typography variant="mono-medium" color="base.03">
        TEXT TO SPEECH
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
      name="textToSpeech.productRef"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Select label="Vendor" options={TTS_VENDORS} {...field} />
          </FormControl>
        </FormItem>
      )}
    />

    <FormField
      control={control}
      name="textToSpeech.config.voice"
      rules={isAutopilot ? { required: true } : {}}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Select label="Voice" options={TTS_VOICES} {...field} />
          </FormControl>
        </FormItem>
      )}
    />
  </>
);
