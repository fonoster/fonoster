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

    <Box sx={{ mt: "8px" }}>
      <Typography variant="mono-medium" color="base.03">
        GENERAL
      </Typography>
      <Typography variant="body-micro" color="base.03">
        Set the Application Type to External if you need custom programmable
        voice applications, or to Autopilot if you want to use Fonoster's
        built-in Autopilot service.
      </Typography>
    </Box>

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
