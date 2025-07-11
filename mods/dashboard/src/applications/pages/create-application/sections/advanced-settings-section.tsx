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
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box
} from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import {
  FormField,
  FormControl,
  FormItem
} from "~/core/components/design-system/forms";
import { Input } from "~/core/components/design-system/ui/input/input";
import type { Control } from "react-hook-form";
import type { Schema } from "../schemas/application-schema";
import { Icon } from "~/core/components/design-system/icons/icons";
import { Select } from "~/core/components/design-system/ui/select/select";
import { EVENTS } from "../schemas/events-hook-schema";
import {
  getLanguageModelModels,
  LANGUAGE_MODEL_PROVIDERS
} from "../create-application.const";
import type { LanguageModelProvider } from "../schemas/language-model-provider";

export const AdvancedSettingsSection = ({
  control,
  languageModelProvider
}: {
  control: Control<Schema>;
  languageModelProvider: LanguageModelProvider;
}) => (
  <>
    <Accordion
      disableGutters
      elevation={0}
      square
      sx={{
        backgroundColor: "transparent",
        border: "solid 1px",
        borderColor: "base.05",
        boxShadow: "none",
        borderRadius: "4px",
        "&:before": { display: "none" }
      }}
    >
      <AccordionSummary
        expandIcon={<Icon name="ArrowDropDown" />}
        aria-controls="create-application-advanced-settings-accordion-content"
        id="create-application-advanced-settings-accordion"
      >
        <Typography>Advanced Settings</Typography>
      </AccordionSummary>
      <AccordionDetails
        sx={{ display: "flex", flexDirection: "column", gap: "24px" }}
      >
        {/* transferOptions (objeto opcional) */}
        <Box sx={{ mt: "8px" }}>
          <Typography variant="mono-medium" color="base.03">
            Transfer Options
          </Typography>
          <Typography variant="body-micro" color="base.03">
            For call transfer, please provide a phone number. Also, optionally,
            you can set a message to be used when the call is transferred and a
            timeout for the transfer operation (in milliseconds).
          </Typography>
        </Box>
        <FormField
          control={control}
          name="intelligence.config.conversationSettings.transferOptions.phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  label="Phone Number"
                  placeholder="e.g. +1234567890"
                  {...field}
                />
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
        <FormField
          control={control}
          name="intelligence.config.conversationSettings.transferOptions.timeout"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="number"
                  label="Timeout (ms)"
                  placeholder="30000"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? undefined : Number(value));
                  }}
                />
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
            This is the message that will be played when there is no activity in
            the call. You can also set a timeout (in milliseconds) and maximum
            timeout count for idle handling.
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
        <FormField
          control={control}
          name="intelligence.config.conversationSettings.idleOptions.timeout"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="number"
                  label="Idle Timeout (ms)"
                  placeholder="30000"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? undefined : Number(value));
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="intelligence.config.conversationSettings.idleOptions.maxTimeoutCount"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="number"
                  label="Max Timeout Count"
                  placeholder="2"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? undefined : Number(value));
                  }}
                />
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
            Select the language model provider and model that best fit your use
            case. If there is an additional model you would like us to support,
            please let us know.
          </Typography>
        </Box>
        <FormField
          control={control}
          name="intelligence.config.languageModel.provider"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select
                  label="Provider"
                  options={LANGUAGE_MODEL_PROVIDERS}
                  {...field}
                />
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
                <Select
                  label="Model"
                  options={getLanguageModelModels(languageModelProvider)}
                  {...field}
                />
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
                <Input
                  type="number"
                  label="Temperature"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? undefined : Number(value));
                  }}
                />
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
                <Input
                  type="number"
                  label="Max Tokens"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? undefined : Number(value));
                  }}
                />
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
            Use this to receive events from Fonoster. You can select the events
            you want to receive. You will need to provide a URL to receive the
            events.
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
        {/* <FormField
          control={control}
          name="intelligence.config.eventsHook.headers"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  label="Headers (JSON, optional)"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        /> */}
        <FormField
          control={control}
          name="intelligence.config.eventsHook.events"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select
                  {...field}
                  multiple
                  label="Events"
                  options={EVENTS}
                  value={Array.isArray(field.value) ? field.value : []}
                  onChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </AccordionDetails>
    </Accordion>
  </>
);
