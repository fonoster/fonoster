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
import { useForm, type ControllerRenderProps } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "~/core/components/design-system/forms";
import { Input } from "~/core/components/design-system/ui/input/input";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useImperativeHandle, useCallback, useState } from "react";
import { schema, type Schema } from "./create-agent.schema";
import { Privacy } from "@fonoster/types";
import { useDomains } from "~/domains/services/domains.service";
import { useCredentials } from "~/credentials/services/credentials.service";
import { Select } from "~/core/components/design-system/ui/select/select";
import { Box } from "@mui/material";
import { ModalTrigger } from "~/core/components/general/modal-trigger";
import { CreateAgentCredentialsModal } from "./create-agent-credentials-modal.modal";

/**
 * Imperative handle interface for CreateAgentForm.
 */
export interface CreateAgentFormHandle {
  submit: () => void;
  isSubmitDisabled?: boolean;
}

/**
 * Props interface for CreateAgentForm.
 */
export interface CreateAgentFormProps extends React.PropsWithChildren {
  initialValues?: Schema;
  onSubmit: (data: Schema) => Promise<void>;
}

/**
 * CreateAgentForm component.
 */
export const CreateAgentForm = forwardRef<
  CreateAgentFormHandle,
  CreateAgentFormProps
>(({ onSubmit, initialValues }, ref) => {
  const [isAgentCredentialsModalOpen, setIsAgentCredentialsModalOpen] =
    useState(false);

  const { data: domains, isLoading: isLoadingDomains } = useDomains();
  const { data: credentials, isLoading: isLoadingCredentials } =
    useCredentials();

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      ref: null,
      name: "",
      username: "",
      domainRef: "",
      credentialsRef: "",
      enabled: true,
      privacy: Privacy.PRIVATE,
      maxContacts: 10,
      ...initialValues
    },
    mode: "onChange"
  });

  useImperativeHandle(ref, () => ({
    submit: () => form.handleSubmit(onSubmit)(),
    isSubmitDisabled: !form.formState.isValid || form.formState.isSubmitting
  }));

  const handleOpenCredentialsModal = useCallback(() => {
    setIsAgentCredentialsModalOpen(true);
  }, []);

  const handleCloseCredentialsModal = useCallback(() => {
    setIsAgentCredentialsModalOpen(false);
  }, []);

  const handleSelectCredentials = useCallback(
    ({ ref }: { ref: string }) => {
      form.setValue("credentialsRef", ref);
      setIsAgentCredentialsModalOpen(false);
    },
    [form]
  );

  const renderDomainsSelect = useCallback(
    (field: ControllerRenderProps<Schema, "domainRef">) => (
      <Select
        label="Domain Ref"
        options={domains.map(({ ref, name }) => ({
          value: ref,
          label: name
        }))}
        disabled={isLoadingDomains || domains.length === 0}
        placeholder={
          isLoadingDomains
            ? "Loading domains..."
            : domains.length === 0
              ? "No domains found. Create one first."
              : ""
        }
        {...field}
      />
    ),
    [domains, isLoadingDomains]
  );

  const renderCredentialsSelect = useCallback(
    (field: ControllerRenderProps<Schema, "credentialsRef">) => (
      <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Select
          {...field}
          label="Credentials"
          options={credentials.map(({ ref, name }) => ({
            value: ref,
            label: name
          }))}
          disabled={isLoadingCredentials || credentials.length === 0}
          placeholder={
            isLoadingCredentials
              ? "Loading credentials..."
              : credentials.length === 0
                ? "No credentials found. Create one first."
                : ""
          }
        />
        <ModalTrigger
          onClick={handleOpenCredentialsModal}
          label="Create New Credentials"
        />
      </Box>
    ),
    [credentials, isLoadingCredentials, handleOpenCredentialsModal]
  );

  return (
    <>
      <Form {...form}>
        <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
          {/* Friendly Name */}
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

          {/* Domain Ref */}
          <FormField
            control={form.control}
            name="domainRef"
            render={({ field }) => (
              <FormItem>
                <FormControl>{renderDomainsSelect(field)}</FormControl>
              </FormItem>
            )}
          />

          {/* Username */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="text" label="Username" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Credentials */}
          <FormField
            control={form.control}
            name="credentialsRef"
            render={({ field }) => (
              <FormItem>
                <FormControl>{renderCredentialsSelect(field)}</FormControl>
              </FormItem>
            )}
          />
        </FormRoot>
      </Form>

      {/* Credentials Modal */}
      <CreateAgentCredentialsModal
        isOpen={isAgentCredentialsModalOpen}
        onClose={handleCloseCredentialsModal}
        onFormSubmit={handleSelectCredentials}
      />
    </>
  );
});
