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
  isAutopilot
}: {
  control: Control<Schema>;
  isAutopilot: boolean;
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

    <Box sx={{ mt: "8px" }}>
      <Typography variant="mono-medium" color="base.03">
        GENERAL
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
              placeholder="https://your-app.com"
              supportingText="For External applications, this is the URL of your application. For Autopilot, this is the URL of the Autopilot service."
              {...field}
            />
          </FormControl>
        </FormItem>
      )}
    />
  </>
);
