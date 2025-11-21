/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of the Fonoster
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

import { useState, useCallback } from "react";
import { Modal } from "~/core/components/design-system/ui/modal/modal";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "~/core/components/design-system/forms";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { Input } from "~/core/components/design-system/ui/input/input";
import { Select } from "~/core/components/design-system/ui/select/select";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box } from "@mui/material";
import { AllowedHttpMethod } from "../schemas/tool-schema";
import { Checkbox } from "~/core/components/design-system/ui/checkbox/checkbox";
import { PropertiesModal } from "./properties-modal.modal";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";

// Local schema for modal form
const schema = z.object({
  name: z.string().nonempty(),
  description: z.string().nonempty(),
  requestStartMessage: z.string().optional(),
  parameters: z.object({
    type: z.enum(["object", "array"]).default("object"),
    properties: z
      .array(
        z.object({
          key: z.string().nonempty(),
          type: z.string().nonempty(),
          format: z.enum(["enum", "date-time"]).optional(),
          pattern: z.string().optional()
        })
      )
      .default([]),
    required: z.array(z.string()).default([])
  }),
  operation: z.object({
    method: z.nativeEnum(AllowedHttpMethod).default(AllowedHttpMethod.GET),
    url: z.string().url(),
    waitForResponse: z.boolean().default(true),
    headers: z
      .array(
        z.object({ key: z.string().nonempty(), value: z.string().nonempty() })
      )
      .default([])
  })
});

type Schema = z.infer<typeof schema>;

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormSubmit: (data: unknown) => void;
  initialValues?: Schema;
}

interface SectionProps {
  title: string;
  description?: string;
}

const Section = ({ title, description }: SectionProps) => (
  <Box sx={{ mt: "8px" }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          fontFamily: "Poppins, sans-serif",
          fontWeight: 600,
          fontSize: 12,
          color: "var(--mui-palette-base-03)"
        }}
      >
        {title}
      </span>
      {description && (
        <span style={{ fontSize: 11, color: "var(--mui-palette-base-03)" }}>
          {description}
        </span>
      )}
    </div>
  </Box>
);

interface ToolFormData {
  name: string;
  description: string;
  requestStartMessage?: string;
  parameters: {
    type: "object" | "array";
    properties: Record<
      string,
      {
        type: string;
        format?: "enum" | "date-time";
        pattern?: string;
      }
    >;
    required: string[];
  };
  operation: {
    method: AllowedHttpMethod;
    url: string;
    waitForResponse: boolean;
    headers?: Record<string, string>;
  };
}

export const CreateToolModal = ({
  isOpen,
  onClose,
  onFormSubmit,
  initialValues
}: ModalProps) => {
  const [isPropertiesModalOpen, setIsPropertiesModalOpen] = useState(false);
  const [editParamIndex, setEditParamIndex] = useState<number | null>(null);
  const [paramInitial, setParamInitial] = useState<
    Schema["parameters"]["properties"][0] | undefined
  >(undefined);

  const form = useForm<Schema>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      parameters: {
        type: initialValues?.parameters?.type ?? "object",
        properties: initialValues?.parameters?.properties
          ? Object.entries(initialValues.parameters.properties).map(
              ([key, v]: any) => ({
                key,
                type: v?.type ?? "string",
                format: v?.format,
                pattern: v?.pattern
              })
            )
          : [],
        required: initialValues?.parameters?.required ?? []
      },
      operation: {
        method: initialValues?.operation?.method ?? AllowedHttpMethod.GET,
        url: initialValues?.operation?.url ?? "",
        waitForResponse: initialValues?.operation?.waitForResponse ?? true,
        headers: initialValues?.operation?.headers
          ? Object.entries(initialValues.operation.headers).map(
              ([key, value]: any) => ({
                key,
                value
              })
            )
          : []
      }
    },
    mode: "onChange"
  });

  const {
    fields: properties,
    append: appendProperty,
    remove: removeProperty
  } = useFieldArray({
    name: "parameters.properties",
    control: form.control
  });

  const {
    fields: headers,
    append: appendHeader,
    remove: removeHeader
  } = useFieldArray({ name: "operation.headers", control: form.control });

  const transformPropertiesToObject = useCallback(
    (propertiesArray: Schema["parameters"]["properties"]) => {
      return Object.fromEntries(
        propertiesArray.map((p) => {
          const entry: {
            type: string;
            format?: "enum" | "date-time";
            pattern?: string;
          } = { type: p.type };
          if (p.format) entry.format = p.format;
          if (p.pattern) entry.pattern = p.pattern;
          return [p.key, entry];
        })
      );
    },
    []
  );

  const transformHeadersToObject = useCallback(
    (headersArray: Schema["operation"]["headers"]) => {
      return Object.fromEntries(
        headersArray.map((h) => [h.key.toLowerCase(), h.value])
      );
    },
    []
  );

  const extractRequiredKeys = useCallback(
    (
      propertiesArray: Schema["parameters"]["properties"],
      requiredArray: string[]
    ) => {
      const propertyKeys = propertiesArray.map((p) => p.key);
      return requiredArray.filter((k) => propertyKeys.includes(k));
    },
    []
  );

  const buildToolData = useCallback(
    (data: Schema): ToolFormData => {
      const propertiesObj = transformPropertiesToObject(
        data.parameters.properties
      );
      const headersObj = transformHeadersToObject(data.operation.headers);
      const requiredCleaned = extractRequiredKeys(
        data.parameters.properties,
        data.parameters.required
      );

      return {
        name: data.name,
        description: data.description,
        requestStartMessage: data.requestStartMessage,
        parameters: {
          type: data.parameters.type,
          properties: propertiesObj,
          required: requiredCleaned
        },
        operation: {
          method: data.operation.method,
          url: data.operation.url,
          waitForResponse: data.operation.waitForResponse,
          ...(Object.keys(headersObj).length ? { headers: headersObj } : {})
        }
      };
    },
    [transformPropertiesToObject, transformHeadersToObject, extractRequiredKeys]
  );

  const resetForm = useCallback(() => {
    form.reset({
      name: "",
      description: "",
      parameters: { type: "object", properties: [], required: [] },
      operation: {
        method: AllowedHttpMethod.GET,
        url: "",
        waitForResponse: true,
        headers: []
      }
    });
  }, [form]);

  const handleSubmit = useCallback(
    (data: Schema) => {
      const tool = buildToolData(data);
      onFormSubmit(tool);
      resetForm();
    },
    [buildToolData, onFormSubmit, resetForm]
  );

  const onInnerSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit(handleSubmit as any)();
    },
    [form, handleSubmit]
  );

  const handleOpenPropertiesModal = useCallback(() => {
    setIsPropertiesModalOpen(true);
  }, []);

  const handleClosePropertiesModal = useCallback(() => {
    setIsPropertiesModalOpen(false);
    setEditParamIndex(null);
    setParamInitial(undefined);
  }, []);

  const handleEditParameter = useCallback(
    (index: number) => {
      const propData = form.getValues(
        `parameters.properties.${index}`
      ) as Schema["parameters"]["properties"][0];
      const initial = {
        key: propData.key,
        type: propData.type,
        format: propData.format,
        pattern: propData.pattern,
        required: (form.getValues("parameters.required") || []).includes(
          propData.key
        )
      };
      setEditParamIndex(index);
      setParamInitial(initial);
      setIsPropertiesModalOpen(true);
    },
    [form]
  );

  const handleRemoveParameter = useCallback(
    (index: number) => {
      const key = form.getValues(
        `parameters.properties.${index}.key`
      ) as string;
      removeProperty(index);

      // Also remove from required if present
      const current = form.getValues("parameters.required") || [];
      form.setValue(
        "parameters.required",
        (current as string[]).filter((k) => k !== key)
      );
    },
    [form, removeProperty]
  );

  const handleAddHeader = useCallback(() => {
    appendHeader({ key: "", value: "" });
  }, [appendHeader]);

  const handleRemoveHeader = useCallback(
    (index: number) => {
      removeHeader(index);
    },
    [removeHeader]
  );

  const handlePropertiesSubmit = useCallback(
    (data: any) => {
      const currentProps = (form.getValues("parameters.properties") ||
        []) as Schema["parameters"]["properties"];

      // Uniqueness by key (excluding self on edit)
      const existsIdx = currentProps.findIndex(
        (p, i) => p.key === data.key && i !== (editParamIndex ?? -1)
      );
      if (existsIdx !== -1) {
        toast("Parameter key must be unique");
        return;
      }

      if (editParamIndex != null) {
        // Update at index
        currentProps[editParamIndex] = {
          key: data.key,
          type: data.type,
          format: data.format,
          pattern: data.pattern
        };
        form.setValue("parameters.properties", currentProps as any);
      } else {
        appendProperty({
          key: data.key,
          type: data.type,
          format: data.format,
          pattern: data.pattern
        } as any);
      }

      // Update required list
      const current = form.getValues("parameters.required") || [];
      const next = data.required
        ? Array.from(new Set([...(current as string[]), data.key]))
        : (current as string[]).filter((k) => k !== data.key);
      form.setValue("parameters.required", next);

      handleClosePropertiesModal();
    },
    [form, editParamIndex, appendProperty, handleClosePropertiesModal]
  );

  const renderParameterItem = useCallback(
    (prop: any, idx: number) => (
      <Box
        key={prop.id}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <span style={{ fontSize: 12 }}>
          {form.watch(`parameters.properties.${idx}.key`) as string} :{" "}
          {form.watch(`parameters.properties.${idx}.type`) as string}
        </span>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleEditParameter(idx)}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleRemoveParameter(idx)}
          >
            Remove
          </Button>
        </Box>
      </Box>
    ),
    [form, handleEditParameter, handleRemoveParameter]
  );

  const renderHeaderItem = useCallback(
    (hdr: any, idx: number) => (
      <Box
        key={hdr.id}
        sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}
      >
        <FormField
          control={form.control}
          name={`operation.headers.${idx}.key` as const}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  label="Header Key"
                  placeholder="x-api-key"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`operation.headers.${idx}.value` as const}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="text" label="Header Value" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            justifyContent: "flex-end"
          }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleRemoveHeader(idx)}
          >
            Remove Header
          </Button>
        </div>
      </Box>
    ),
    [form, handleRemoveHeader]
  );

  return (
    <>
      <Modal open={isOpen} onClose={onClose} title="Add Tool">
        <Form {...form}>
          <FormRoot onSubmit={onInnerSubmit}>
            <Section title="General" />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="text" label="Name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="text" label="Description" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestStartMessage"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="text"
                      label="Request Start Message"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Section
              title="Parameters"
              description="Define JSON schema for tool parameters."
            />

            <FormField
              control={form.control}
              name="parameters.type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select
                      label="Parameters Type"
                      options={[
                        { value: "object", label: "object" },
                        { value: "array", label: "array" }
                      ]}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Properties editor via modal pattern */}
            {properties.length > 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {properties.map((prop, idx) => renderParameterItem(prop, idx))}
              </Box>
            )}

            <Button
              size="small"
              variant="outlined"
              onClick={handleOpenPropertiesModal}
            >
              Add Parameter
            </Button>

            <Section title="Operation" />

            <FormField
              control={form.control}
              name="operation.method"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select
                      label="HTTP Method"
                      options={[
                        { value: "get", label: "GET" },
                        { value: "post", label: "POST" }
                      ]}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="operation.url"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="text"
                      label="URL"
                      placeholder="https://api.example.com/path"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="operation.waitForResponse"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Checkbox
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    >
                      Wait for the server's response before proceeding
                    </Checkbox>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Headers editor */}
            {headers.map((hdr, idx) => renderHeaderItem(hdr, idx))}

            <Button size="small" variant="outlined" onClick={handleAddHeader}>
              Add Header
            </Button>

            <Button
              type="submit"
              disabled={!form.formState.isValid}
              isFullWidth
              size="small"
            >
              Add Tool
            </Button>
          </FormRoot>
        </Form>
      </Modal>

      <PropertiesModal
        isOpen={isPropertiesModalOpen}
        onClose={handleClosePropertiesModal}
        initialValues={paramInitial as any}
        onFormSubmit={handlePropertiesSubmit}
      />
    </>
  );
};
