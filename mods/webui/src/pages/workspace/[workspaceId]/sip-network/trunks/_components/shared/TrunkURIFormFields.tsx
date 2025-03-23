import { InputContext } from "@/common/hooksForm/InputContext";
import { SelectContext } from "@/common/hooksForm/SelectContext";
import { UseFormReturn } from "react-hook-form";
import PageContainer from "@/common/components/layout/pages";
import { ReactNode } from "react";
import { CheckboxContext } from "@/common/hooksForm/CheckboxContext";
import { Transport } from "../hooks/useTrunkURIForm";

/**
 * Props for the TrunkURIFormFields component
 */
interface TrunkURIFormFieldsProps {
  /** React Hook Form methods */
  methods: UseFormReturn<any>;

  /** Unique identifier for the form */
  formId: string;

  /** Optional children to render at the bottom of the form */
  children?: ReactNode;
}

/**
 * Reusable component for TrunkURI form fields
 *
 * This component provides a consistent set of form fields
 * for SIP URI management, which can be used in different contexts.
 *
 * @param {TrunkURIFormFieldsProps} props - Component props
 * @returns {JSX.Element} The rendered form fields
 */
export const TrunkURIFormFields = ({
  methods,
  formId,
  children
}: TrunkURIFormFieldsProps) => {
  const transportOptions = Object.keys(Transport).map((key) => ({
    value: Transport[key as keyof typeof Transport],
    label: key
  }));

  return (
    <PageContainer.ContentForm methods={methods} formId={formId}>
      <InputContext
        name="host"
        label="IP or Hostname*"
        type="text"
        leadingIcon={null}
        trailingIcon={null}
        id={`${formId}-host`}
        placeholder="example.com or 192.168.1.1"
      />

      <InputContext
        name="user"
        label="User"
        type="text"
        leadingIcon={null}
        trailingIcon={null}
        id={`${formId}-user`}
        placeholder="Optional username for authentication"
      />

      <InputContext
        name="port"
        label="Port*"
        type="number"
        leadingIcon={null}
        trailingIcon={null}
        id={`${formId}-port`}
      />

      <SelectContext
        name="transport"
        label="Transport Protocol*"
        leadingIcon={null}
        trailingIcon={null}
        id={`${formId}-transport`}
        options={transportOptions}
      />

      <InputContext
        name="weight"
        label="Weight*"
        type="number"
        leadingIcon={null}
        trailingIcon={null}
        id={`${formId}-weight`}
      />

      <InputContext
        name="priority"
        label="Priority*"
        type="number"
        leadingIcon={null}
        trailingIcon={null}
        id={`${formId}-priority`}
      />

      <CheckboxContext
        name="enabled"
        label="Enable Outbound SIP URI"
        id={`${formId}-enabled`}
      />

      {children}
    </PageContainer.ContentForm>
  );
};
