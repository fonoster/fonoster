import { useRouter } from "next/router";
import PageContainer from "@/common/components/layout/pages";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { Box, Skeleton } from "@mui/material";
import { Button } from "@stories/button/Button";
import {
  useCredentialForm,
  CredentialFormData
} from "../hooks/useCredentialForm";
import { CredentialFormFields } from "../shared/CredentialFormFields";

interface CredentialFormProps {
  initialData?: CredentialFormData;
  formId?: string;
  credentialId?: string | null;
  isLoading?: boolean;
}

/**
 * Skeleton component shown during loading states
 */
function FormSkeleton({ formId = "credential-form" }: { formId?: string }) {
  return (
    <PageContainer>
      {/* Header skeleton */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          px: 3,
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

        {/* Username field */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Password field */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Confirm password field */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton variant="text" width={300} height={16} sx={{ mt: 0.5 }} />
        </Box>
      </Box>
    </PageContainer>
  );
}

/**
 * Main component for creating or editing credentials
 *
 * This component provides a full page form for credential management,
 * with support for both creating new credentials and editing existing ones.
 */
export default function CredentialForm({
  initialData,
  formId = "credential-form",
  credentialId,
  isLoading
}: CredentialFormProps) {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const isEditMode = !!credentialId;

  const { methods, isValid, onSubmit } = useCredentialForm({
    initialData,
    isEditMode,
    credentialId: credentialId as string,
    onSuccess: () => {
      setTimeout(() => {
        router.push(
          `/workspace/${selectedWorkspace?.ref}/sip-network/credentials`
        );
      }, 1500);
    }
  });

  if (isLoading) {
    return <FormSkeleton formId={formId} />;
  }

  return (
    <PageContainer>
      <PageContainer.Header
        title={!isEditMode ? "Create New Credential" : "Edit Credential"}
        backTo={{
          label: "Back to Credentials",
          onClick: () =>
            router.push(
              `/workspace/${selectedWorkspace?.ref}/sip-network/credentials`
            )
        }}
        actions={
          <Button variant="contained" disabled={!isValid} onClick={onSubmit}>
            {!isEditMode ? "Create Credential" : "Update Credential"}
          </Button>
        }
      />
      <PageContainer.Subheader>
        Create a new credential to protect your Agent or Trunk.
      </PageContainer.Subheader>

      <CredentialFormFields methods={methods} formId={formId} />
    </PageContainer>
  );
}
