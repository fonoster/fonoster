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
import { useCallback, useState, useEffect } from "react";
import { schema, type Schema } from "./create-agent.schema";
import { Privacy } from "@fonoster/types";
import { useDomains } from "~/domains/services/domains.service";
import { useCredentials } from "~/credentials/services/credentials.service";
import { Select } from "~/core/components/design-system/ui/select/select";
import { ResourceIdField } from "~/core/components/design-system/ui/resource-id-field/resource-id-field";
import { Box } from "@mui/material";
import { ModalTrigger } from "~/core/components/general/modal-trigger";
import { CreateAgentCredentialsModal } from "./create-agent-credentials-modal.modal";
import { useFormContextSync } from "~/core/hooks/use-form-context-sync";

/**
 * Props interface for CreateAgentForm.
 */
export interface CreateAgentFormProps extends React.PropsWithChildren {
  initialValues?: Schema;
  onSubmit: (data: Schema) => Promise<void>;
  isEdit?: boolean;
}

/**
 * CreateAgentForm component.
 */
export function CreateAgentForm({
  onSubmit,
  initialValues,
  isEdit
}: CreateAgentFormProps) {
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
      expires: 3600,
      ...initialValues
    },
    mode: "onChange"
  });

  /** Sync form state with FormContext */
  useFormContextSync(form, onSubmit);

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

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
        label="Domain"
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
        allowClear={true}
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
          allowClear={true}
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
          {/* Agent ID - Only show in edit mode */}
          {isEdit && initialValues?.ref && (
            <ResourceIdField value={initialValues.ref} label="Agent Ref" />
          )}

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

          {/* Max Contacts */}
          <FormField
            control={form.control}
            name="maxContacts"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="number" label="Max Contacts" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Expires */}
          <FormField
            control={form.control}
            name="expires"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="number" label="Expires (seconds)" {...field} />
                </FormControl>
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
}
