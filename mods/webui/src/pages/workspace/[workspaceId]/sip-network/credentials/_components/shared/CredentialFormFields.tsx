import { InputContext } from "@/common/hooksForm/InputContext";
import { UseFormReturn } from "react-hook-form";
import PageContainer from "@/common/components/layout/pages";
import { ReactNode } from "react";
import { PASSWORD_REQUIREMENTS } from "../hooks/useCredentialForm";

/**
 * Props for the CredentialFormFields component
 * @property {UseFormReturn<any>} methods - React Hook Form methods
 * @property {string} formId - Unique identifier for the form
 * @property {ReactNode} children - Optional children to render at the bottom of the form
 */
interface CredentialFormFieldsProps {
  methods: UseFormReturn<any>;
  formId: string;
  children?: ReactNode;
}

/**
 * Reusable component for credential form fields
 *
 * This component provides a consistent set of form fields for credential management,
 * which can be used across different contexts like the full page form or a modal.
 *
 * @param {CredentialFormFieldsProps} props - Component props
 * @returns {JSX.Element} The rendered form fields
 */
export const CredentialFormFields = ({
  methods,
  formId,
  children
}: CredentialFormFieldsProps) => {
  return (
    <PageContainer.ContentForm methods={methods} formId={formId}>
      {/* Friendly Name */}
      <InputContext
        name="name"
        label="Friendly Name*"
        type="text"
        leadingIcon={null}
        trailingIcon={null}
        id={`${formId}-name`}
      />

      {/* Username */}
      <InputContext
        name="username"
        label="Username*"
        type="text"
        leadingIcon={null}
        trailingIcon={null}
        id={`${formId}-username`}
      />

      {/* Password */}
      <InputContext
        name="password"
        label="Password*"
        type="password"
        leadingIcon={null}
        trailingIcon={null}
        id={`${formId}-password`}
      />

      {/* Confirm Password */}
      <InputContext
        name="confirmPassword"
        label="Confirm Password*"
        type="password"
        leadingIcon={null}
        trailingIcon={null}
        id={`${formId}-confirm-password`}
        helperText={PASSWORD_REQUIREMENTS}
      />

      {/* Optional children like additional fields or buttons */}
      {children}
    </PageContainer.ContentForm>
  );
};
