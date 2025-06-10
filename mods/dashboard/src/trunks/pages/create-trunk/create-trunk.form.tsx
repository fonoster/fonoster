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
import { useFieldArray, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "~/core/components/design-system/forms";
import { Input } from "~/core/components/design-system/ui/input/input";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { schema, type Schema } from "./create-trunk.schema";
import type { Trunk } from "@fonoster/types";
import { Box } from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { Select } from "~/core/components/design-system/ui/select/select";
import { useAcls } from "~/acls/services/acls.service";
import { ModalTrigger } from "~/core/components/general/modal-trigger";
import { useCredentials } from "~/credentials/services/credentials.service";
import { CreateTrunkCredentialsModal } from "./create-trunk-credentials-modal.modal";
import { CreateTrunkAclsModal } from "./create-trunk-acls-modal.modal";
import { Checkbox } from "~/core/components/design-system/ui/checkbox/checkbox";
import { CreateTrunkUrisModal } from "./create-trunk-uris-modal.modal";
import { Tooltip } from "~/core/components/design-system/ui/tooltip/tooltip";

/**
 * Imperative handle interface exposing a submit method and validation state.
 *
 * Allows parent components to trigger form submission and to check if the submit button should be disabled.
 */
export interface CreateTrunkFormHandle {
  submit: () => void;
  reset: () => void;
  /** Indicates if the submit button should be disabled based on form state */
  isSubmitDisabled?: boolean;
}

/**
 * Props interface for the CreateTrunkForm component.
 */
export interface CreateTrunkFormProps extends React.PropsWithChildren {
  /** Optional initial values to populate the form fields with. */
  initialValues?: Schema;
  /** Callback triggered on successful form submission. */
  onSubmit: (data: Schema) => Promise<Trunk | void | null>;
}

/**
 * CreateTrunkForm component.
 *
 * Renders a form for creating a trunk, including fields for:
 * - Friendly Name
 * - Trunk
 * - Country
 * - City
 * - Tel URL
 * - Inbound Application
 *
 * Integrates:
 * - React Hook Form for state management
 * - Zod for schema validation
 * - Imperative handle for exposing a submit method to parent components
 *
 * @param {CreateTrunkFormProps} props - Props including onSubmit handler and optional initial values.
 * @param {React.Ref<CreateTrunkFormHandle>} ref - Ref exposing submit functionality.
 * @returns {JSX.Element} The rendered Create Trunk form.
 */
export const CreateTrunkForm = forwardRef<
  CreateTrunkFormHandle,
  CreateTrunkFormProps
>(({ onSubmit, initialValues }, ref) => {
  const [isTrunkCredentialsModalOpen, setIsTrunkCredentialsModalOpen] =
    useState(false);

  const [isTrunkAclsModalOpen, setIsTrunkAclsModalOpen] = useState(false);

  const [isTrunkUrisModalOpen, setIsTrunkUrisModalOpen] = useState(false);

  const { data: acls, isLoading: isAclsLoading } = useAcls();
  const { data: credentials, isLoading: isLoadingCredentials } =
    useCredentials();

  /** Initializes the React Hook Form with Zod validation and initial values. */
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      ref: null,
      name: "",
      sendRegister: true,
      inboundUri: "",
      accessControlListRef: "",
      inboundCredentialsRef: "",
      outboundCredentialsRef: "",
      uris: [],
      ...initialValues
    },
    mode: "onChange"
  });

  const {
    fields: uris,
    append: appendURI,
    remove: removeURI
  } = useFieldArray<Schema>({
    name: "uris",
    control: form.control
  });

  /** Exposes the submit method and submit state via the imperative handle. */
  useImperativeHandle(ref, () => ({
    submit: () => {
      form.handleSubmit(onSubmit)();
    },
    reset: () => {
      form.reset();
    },
    isSubmitDisabled: !form.formState.isValid || form.formState.isSubmitting
  }));

  /**
   * Builds the displayed values for the Select, each formatted as "type:name".
   */
  const selectValues = uris.map(
    ({ transport, host, port, enabled }) =>
      `${transport.toLowerCase()}:${host}:${port} (${enabled ? "enabled" : "disabled"})`
  );

  /**
   * Builds the Select options, matching the Select values.
   */
  const selectOptions = uris.map(({ transport, host, port, enabled }) => ({
    value: `${transport.toLowerCase()}:${host}:${port} (${enabled ? "enabled" : "disabled"})`,
    label: `${transport.toLowerCase()}:${host}:${port} (${enabled ? "enabled" : "disabled"})`
  }));

  const handleDelete = useCallback(
    (oldValues: string[], newValues: string[]) => {
      const deleted = oldValues.find((val) => !newValues.includes(val));
      if (deleted) {
        const index = uris.findIndex(
          ({ transport, host, port, enabled }) =>
            `${transport.toLowerCase()}:${host}:${port} (${enabled ? "enabled" : "disabled"})` ===
            deleted
        );
        if (index !== -1) {
          removeURI(index);
        }
      }
    },
    [uris, removeURI]
  );

  /**
   * Renders the form with individual fields wrapped in FormField and FormItem components.
   */
  return (
    <>
      <Form {...form}>
        <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
          {/* Friendly Name Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="text" label="Friendly Name" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Text to Speech Section */}
          <Box sx={{ mt: "8px" }}>
            <Typography variant="mono-medium" color="base.03">
              INBOUND
            </Typography>
            <Typography variant="body-micro" color="base.03">
              Outgoing traffic from your communications infrastructure to the
              PSTN. In order to use a Trunk for termination it must have a
              Termination SIP URI and at least one authentication scheme (IP
              Access Control Lists and/or Credential Lists).
            </Typography>
          </Box>

          {/* Friendly Name Field */}
          <FormField
            control={form.control}
            name="inboundUri"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="text" label="Inbound SIP URI" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accessControlListRef"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}
                  >
                    <Select
                      label="Access Control List (ACL)"
                      options={acls.map(({ ref, name }) => ({
                        value: ref,
                        label: name
                      }))}
                      disabled={isAclsLoading || acls.length === 0}
                      placeholder={
                        isAclsLoading
                          ? "Loading ACLs..."
                          : acls.length === 0
                            ? "No ACLs found. Create one first."
                            : ""
                      }
                      {...field}
                    />

                    {/* Modal trigger to open rule creation */}
                    <ModalTrigger
                      onClick={() => setIsTrunkAclsModalOpen(true)}
                      label="Create New Access Control List"
                    />
                  </Box>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="inboundCredentialsRef"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}
                  >
                    <Select
                      {...field}
                      label="Inbound Credentials"
                      options={credentials.map(({ ref, name }) => ({
                        value: ref,
                        label: name
                      }))}
                      disabled={
                        isLoadingCredentials || credentials.length === 0
                      }
                      placeholder={
                        isLoadingCredentials
                          ? "Loading credentials..."
                          : credentials.length === 0
                            ? "No credentials found. Create one first."
                            : ""
                      }
                    />
                    <ModalTrigger
                      onClick={() => setIsTrunkCredentialsModalOpen(true)}
                      label="Create New Inbound Credentials"
                    />
                  </Box>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Text to Speech Section */}
          <Box sx={{ mt: "8px" }}>
            <Typography variant="mono-medium" color="base.03">
              OUTBOUND
            </Typography>
            <Typography variant="body-micro" color="base.03">
              Outgoing traffic from your communications infrastructure to the
              PSTN. In order to use a Trunk for termination it must have a
              Termination SIP URI and at least one authentication scheme (IP
              Access Control Lists and/or Credential Lists).
            </Typography>
          </Box>

          <FormField
            control={form.control}
            name="outboundCredentialsRef"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}
                  >
                    <Select
                      {...field}
                      label="Outbound Credentials"
                      options={credentials.map(({ ref, name }) => ({
                        value: ref,
                        label: name
                      }))}
                      disabled={
                        isLoadingCredentials || credentials.length === 0
                      }
                      placeholder={
                        isLoadingCredentials
                          ? "Loading credentials..."
                          : credentials.length === 0
                            ? "No credentials found. Create one first."
                            : ""
                      }
                    />
                    <ModalTrigger
                      onClick={() => setIsTrunkCredentialsModalOpen(true)}
                      label="Create New Outbound Credentials"
                    />
                  </Box>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="uris"
            render={() => (
              <FormItem>
                <FormControl>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}
                  >
                    {/* Read-only Select showing current rules */}
                    <Select
                      label="Outbound SIP URIs"
                      placeholder="Click below to add SIP URIs"
                      multiple
                      value={selectValues}
                      options={selectOptions}
                      disabled
                      onChange={(event) => {
                        const newValues = event.target.value as string[];
                        handleDelete(selectValues, newValues);
                      }}
                    />

                    {/* Modal trigger to open rule creation */}
                    <ModalTrigger
                      onClick={() => setIsTrunkUrisModalOpen(true)}
                      label="Create Outbound SIP URI"
                    />
                  </Box>
                </FormControl>
              </FormItem>
            )}
          />

          <Box sx={{ mt: "12px" }}>
            <FormField
              control={form.control}
              name="sendRegister"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled
                    >
                      <Tooltip title="This feature is not yet available. (Coming soon!)">
                        <span>Send SIP Register requests for this trunk</span>
                      </Tooltip>
                    </Checkbox>
                  </FormControl>
                </FormItem>
              )}
            />
          </Box>
        </FormRoot>
      </Form>

      {/* Credentials Modal */}
      <CreateTrunkCredentialsModal
        isOpen={isTrunkCredentialsModalOpen}
        onClose={() => setIsTrunkCredentialsModalOpen(false)}
      />

      <CreateTrunkAclsModal
        isOpen={isTrunkAclsModalOpen}
        onClose={() => setIsTrunkAclsModalOpen(false)}
      />

      <CreateTrunkUrisModal
        isOpen={isTrunkUrisModalOpen}
        onClose={() => setIsTrunkUrisModalOpen(false)}
        onFormSubmit={(uri) => {
          appendURI(uri);
        }}
      />
    </>
  );
});
