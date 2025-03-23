import { InputContext } from "@/common/hooksForm/InputContext";
import { UseFormReturn } from "react-hook-form";
import PageContainer from "@/common/components/layout/pages";
import { ReactNode } from "react";
import { SelectContext } from "@/common/hooksForm/SelectContext";
import { ModalTrigger } from "@stories/modaltrigger/ModalTrigger";

/**
 * Props for the ACLFormFields component
 */
interface ACLFormFieldsProps {
  /** React Hook Form methods */
  methods: UseFormReturn<any>;

  /** Unique identifier for the form */
  formId: string;

  /** Optional callback when the Add Rule button is clicked */
  onAddRuleClick?: () => void;

  /** Optional children to render at the bottom of the form */
  children?: ReactNode;

  /** Array of allowed networks */
  allow: string[];

  /** Array of denied networks */
  deny: string[];
}

/**
 * Reusable component for ACL form fields
 *
 * This component provides a consistent set of form fields for ACL management,
 * which can be used across different contexts like the full page form or a modal.
 *
 * @param {ACLFormFieldsProps} props - Component props
 * @returns {JSX.Element} The rendered form fields
 */
export const ACLFormFields = ({
  methods,
  formId,
  onAddRuleClick,
  children,
  allow,
  deny
}: ACLFormFieldsProps) => {
  return (
    <PageContainer.ContentForm methods={methods} formId={formId}>
      <InputContext
        name="name"
        label="Friendly Name*"
        type="text"
        leadingIcon={null}
        trailingIcon={null}
        id={`${formId}-name`}
      />

      <SelectContext
        name="allow"
        label="Allowed Networks"
        leadingIcon={null}
        trailingIcon={null}
        id={`${formId}-allow`}
        multiple={true}
        options={allow.map((network) => ({
          value: network,
          label: network
        }))}
      />

      <SelectContext
        name="deny"
        label="Denied Networks"
        leadingIcon={null}
        trailingIcon={null}
        id={`${formId}-deny`}
        multiple={true}
        options={deny.map((network) => ({
          value: network,
          label: network
        }))}
      />

      <ModalTrigger label="Add Rule" onClick={onAddRuleClick} />

      {children}
    </PageContainer.ContentForm>
  );
};
