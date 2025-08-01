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
import {
  useCallback,
  useState,
  useEffect
} from "react";
import { schema, type Schema } from "./create-domain.schema";
import { useAcls } from "~/acls/services/acls.service";
import { Select } from "~/core/components/design-system/ui/select/select";
import { ModalTrigger } from "~/core/components/general/modal-trigger";
import { Box } from "@mui/material";
import { useNumbers } from "~/numbers/services/numbers.service";
import { CreateRuleModal } from "./create-domain-rules-modal.modal";
import { CreateDomainAclsModal } from "./create-domain-acls-modal.modal";
import type { Acl } from "@fonoster/types";
import { useFormContextSync } from "~/core/hooks/use-form-context-sync";

/**
 * Props interface for the CreateDomainForm component.
 */
export interface CreateDomainFormProps extends React.PropsWithChildren {
  /** Optional initial values to populate the form fields with. */
  initialValues?: Schema;
  /** Callback triggered on successful form submission. */
  onSubmit: (data: Schema) => Promise<void>;
  /** Whether this form is for editing an existing domain. */
  isEdit?: boolean;
}

/**
 * CreateDomainForm component.
 *
 * Renders a form for creating a domain, including fields for:
 * - Friendly Name
 * - Domain URI
 * - Access Control List
 * - Egress Policies
 *
 * Integrates:
 * - React Hook Form for state management
 * - Zod for schema validation
 * - FormContext for state synchronization
 *
 * @param {CreateDomainFormProps} props - Props including onSubmit handler and optional initial values.
 * @returns {JSX.Element} The rendered Create Domain form.
 */
export function CreateDomainForm({ onSubmit, initialValues, isEdit }: CreateDomainFormProps) {
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isDomainAclsModalOpen, setIsDomainAclsModalOpen] = useState(false);

  const {
    data: aclsData,
    isLoading: isAclsLoading,
    refetch: refetchAcls
  } = useAcls();
  const [acls, setAcls] = useState<Acl[]>([]);

  const { data: numbers, isLoading: isNumbersLoading } = useNumbers();

  /** Initializes the React Hook Form with Zod validation and initial values. */
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      ref: null,
      name: "",
      domainUri: "",
      accessControlListRef: "",
      egressPolicies: [],
      ...initialValues
    },
    mode: "onChange"
  });

  /** React Hook Form's useFieldArray for dynamic list of rules. */
  const { fields: policies, append: appendEgressPolicy } = useFieldArray({
    name: "egressPolicies",
    control: form.control
  });

  /** Sync form state with FormContext */
  useFormContextSync(form, onSubmit, isEdit);

  const getNumberName = useCallback(
    (numberRef: string) => {
      if (!numbers || isNumbersLoading) {
        return "Loading...";
      }

      const number = numbers.find((num) => num.ref === numberRef);
      return number ? number.name : "Unknown Number";
    },
    [numbers, isNumbersLoading]
  );

  /**
   * Builds the displayed values for the Select, each formatted as "type:name".
   */
  const selectValues = policies.map(
    (item) => `${getNumberName(item.numberRef)} (${item.rule})`
  );

  /**
   * Builds the Select options, matching the Select values.
   */
  const selectOptions = policies.map(({ rule, numberRef }) => ({
    value: `${rule}:${numberRef}`,
    label: `${getNumberName(numberRef)} (${rule})`
  }));

  // Keep local ACLs in sync with remote data
  useEffect(() => {
    setAcls(aclsData);
  }, [aclsData]);

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

          <FormField
            control={form.control}
            name="domainUri"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="text" label="Domain URI" {...field} />
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
                    <ModalTrigger
                      onClick={() => setIsDomainAclsModalOpen(true)}
                      label="Create New Access Control List"
                    />
                  </Box>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="egressPolicies"
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
                      label="Egree Rules"
                      placeholder="Click below to add rules (e.g., .*)."
                      multiple
                      value={selectValues}
                      options={selectOptions}
                      disabled
                      onChange={(event) => {
                        const selectedValues = event.target.value as string[];
                        // Update the form state with selected values
                        form.setValue(
                          "egressPolicies",
                          selectedValues.map((value) => {
                            const [rule, numberRef] = value.split(":");
                            return { rule, numberRef };
                          })
                        );
                      }}
                    />

                    {/* Modal trigger to open rule creation */}
                    <ModalTrigger
                      onClick={() => setIsRulesModalOpen(true)}
                      label="Create New Egress Rule"
                    />
                  </Box>
                </FormControl>
              </FormItem>
            )}
          />
        </FormRoot>
      </Form>

      {/* Modal for creating new ACL rules */}
      <CreateRuleModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        onFormSubmit={(rule) => {
          appendEgressPolicy(rule);
          setIsRulesModalOpen(false);
        }}
      />

      <CreateDomainAclsModal
        isOpen={isDomainAclsModalOpen}
        onClose={() => setIsDomainAclsModalOpen(false)}
        onFormSubmit={(newAcl) => {
          // Add the new ACL to the local list and select it
          setAcls((prev) => [...prev, newAcl]);
          form.setValue("accessControlListRef", newAcl.ref);
        }}
      />
    </>
  );
}
