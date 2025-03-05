import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputContext } from "@/common/hooksForm/InputContext";
import { SelectContext } from "@/common/hooksForm/SelectContext";
import { Role } from "@fonoster/types";
import { useState } from "react";
import { useAPIKey } from "@/common/sdk/hooks/useAPIKey";
import { useRouter } from "next/router";
import { Alert, Snackbar, Button } from "@mui/material";
import PageContainer from "@/common/components/layout/pages";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";

const apiKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  ref: z.string().optional()
});

export type APIKeyFormData = z.infer<typeof apiKeySchema>;

const roleOptions = [
  { value: Role.USER, label: "User" },
  { value: Role.WORKSPACE_OWNER, label: "Workspace Owner" },
  { value: Role.WORKSPACE_ADMIN, label: "Workspace Admin" },
  { value: Role.WORKSPACE_MEMBER, label: "Workspace Member" }
];

interface APIKeyFormProps {
  initialData?: APIKeyFormData;
  formId?: string;
  apiKeyId?: string | null;
}

export default function APIKeyForm({
  initialData,
  formId = "api-key-form",
  apiKeyId
}: APIKeyFormProps) {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { createAPIKey, regenerateAPIKey } = useAPIKey();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditMode = !!apiKeyId;

  const methods = useForm<APIKeyFormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      role: initialData?.role || Role.WORKSPACE_ADMIN,
      ref: initialData?.ref || ""
    }
  });

  const handleSubmit = methods.handleSubmit(async (data) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!isEditMode) {
        const result = await createAPIKey({
          name: data.name,
          description: data.description,
          role: data.role as Role
        });

        if (result) {
          setSuccess("API Key created successfully");
        }
      } else {
        if (data.ref) {
          const regenerateResult = await regenerateAPIKey(data.ref);
          if (!regenerateResult) {
            throw new Error("Failed to regenerate API Key");
          }
        }

        setSuccess("API Key updated successfully");
      }
    } catch (error: any) {
      console.error(
        `Error ${!isEditMode ? "creating" : "updating"} API Key:`,
        error
      );
      setError(
        error.message ||
          `Failed to ${!isEditMode ? "create" : "update"} API Key`
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <PageContainer>
      <PageContainer.Header
        title={!isEditMode ? "Create New API Key" : "Edit API Key"}
        backTo={{
          label: "Back to API Keys",
          onClick: () =>
            router.push(`/workspace/${selectedWorkspace?.ref}/api-keys`)
        }}
        actions={
          <Button
            type="submit"
            form={formId}
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {!isEditMode ? "Create API Key" : "Update API Key"}
          </Button>
        }
      />

      <PageContainer.Subheader>
        You API Keeys are only available for use within this Workspace.
      </PageContainer.Subheader>
      <PageContainer.ContentForm methods={methods} formId={formId}>
        <InputContext
          name="name"
          label="API Key Name"
          type="text"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-name`}
        />

        <InputContext
          name="description"
          label="Description"
          type="text"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-description`}
        />

        <SelectContext
          name="role"
          label="Access Role"
          options={roleOptions}
          id={`${formId}-role`}
        />

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={() => setError(null)} severity="error">
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={() => setSuccess(null)} severity="success">
            {success}
          </Alert>
        </Snackbar>
      </PageContainer.ContentForm>
    </PageContainer>
  );
}
