import { useRouter } from "next/router";
import PageContainer from "@/common/components/layout/pages";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { Box, Skeleton } from "@mui/material";
import { Button } from "@stories/button/Button";
import { useState } from "react";
import CreateRuleModal from "../modal/CreateRuleModal";
import { useACLForm, ACLFormData } from "../hooks/useACLForm";
import { ACLFormFields } from "../shared/ACLFormFields";

/**
 * Props for the ACLsForm component
 */
interface ACLsFormProps {
  /** Initial data for the form, used in edit mode */
  initialData?: ACLFormData;

  /** Unique identifier for the form */
  formId?: string;

  /** ID of the ACL being edited, null for creation */
  aclId?: string | null;

  /** Whether the form is in loading state */
  isLoading?: boolean;
}

/**
 * Skeleton component shown during loading states
 */
function FormSkeleton({ formId = "acl-form" }: { formId?: string }) {
  return (
    <PageContainer>
      {/* Header skeleton */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          px: 4,
          pt: 3
        }}
      >
        <Box>
          <Box sx={{ mb: 1 }}>
            <Skeleton variant="text" width={117} height={18} />
          </Box>
          <Skeleton variant="text" width={264} height={32} />
        </Box>

        <Skeleton
          variant="rectangular"
          width={138}
          height={33}
          sx={{ borderRadius: 4 }}
        />
      </Box>

      {/* Subheader skeleton */}
      <Box sx={{ px: 3, mb: 8 }}>
        <Skeleton variant="text" width={350} height={20} />
      </Box>

      {/* Form fields skeleton */}
      <Box sx={{ px: 3, pb: 3 }}>
        {/* Name field */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Allowed Networks field */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Denied Networks field */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Add Rule button */}
        <Box sx={{ mt: 4 }}>
          <Skeleton variant="text" width={80} height={24} />
        </Box>
      </Box>
    </PageContainer>
  );
}

/**
 * Main component for creating or editing ACLs
 *
 * This component provides a full page form for ACL management,
 * with support for both creating new ACLs and editing existing ones.
 */
export default function ACLsForm({
  initialData,
  formId = "acl-form",
  aclId,
  isLoading
}: ACLsFormProps) {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  const isEditMode = !!aclId;

  // Initialize form with ACL hook
  const { methods, isValid, onSubmit, addRule, allow, deny } = useACLForm({
    initialData,
    isEditMode,
    aclId: aclId as string,
    onSuccess: () => {
      // Navigate back to list after successful operation
      router.push(`/workspace/${selectedWorkspace?.ref}/sip-network/acls`);
    }
  });

  // Show skeleton loader during loading
  if (isLoading) {
    return <FormSkeleton formId={formId} />;
  }

  return (
    <PageContainer>
      <PageContainer.Header
        title={!isEditMode ? "Create New ACL" : "Edit ACL"}
        backTo={{
          label: "Back to ACLs",
          onClick: () =>
            router.push(`/workspace/${selectedWorkspace?.ref}/sip-network/acls`)
        }}
        actions={
          <Button variant="contained" disabled={!isValid} onClick={onSubmit}>
            {!isEditMode ? "Create ACL" : "Update ACL"}
          </Button>
        }
      />
      <PageContainer.Subheader>
        Create a new ACL to control access to your SIP network.
      </PageContainer.Subheader>

      {/* Reuse the shared ACL form fields */}
      <ACLFormFields
        methods={methods}
        formId={formId}
        onAddRuleClick={() => setIsRuleModalOpen(true)}
        allow={allow}
        deny={deny}
      />

      <CreateRuleModal
        open={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        onSave={addRule}
      />
    </PageContainer>
  );
}
