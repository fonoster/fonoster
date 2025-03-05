import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputContext } from "@/common/hooksForm/InputContext";
import { useState } from "react";
import { useSecret } from "@/common/sdk/hooks/useSecret";
import { useRouter } from "next/router";
import { Alert, Snackbar, Button } from "@mui/material";
import PageContainer from "@/common/components/layout/pages";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";

const secretSchema = z.object({
  name: z.string().min(1, "Name is required"),
  secret: z.string().min(1, "Secret is required"),
  ref: z.string().optional()
});

export type SecretFormData = z.infer<typeof secretSchema>;

interface SecretFormProps {
  initialData?: SecretFormData;
  formId?: string;
  secretId?: string | null;
}

export default function SecretForm({
  initialData,
  formId = "secret-form",
  secretId
}: SecretFormProps) {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { createSecret, updateSecret } = useSecret();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditMode = !!secretId;

  const methods = useForm<SecretFormData>({
    resolver: zodResolver(secretSchema),
    defaultValues: {
      name: initialData?.name || "",
      secret: initialData?.secret || "",
      ref: initialData?.ref || ""
    }
  });

  const handleSubmit = methods.handleSubmit(async (data) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!isEditMode) {
        const result = await createSecret({
          name: data.name,
          secret: data.secret
        });

        if (result) {
          setSuccess("Secret created successfully");
          setTimeout(() => {
            router.push(`/workspace/${selectedWorkspace?.ref}/secrets`);
          }, 1500);
        }
      } else {
        const result = await updateSecret({
          ref: secretId as string,
          name: data.name,
          secret: data.secret
        });

        if (result) {
          setSuccess("Secret updated successfully");
          setTimeout(() => {
            router.push(`/workspace/${selectedWorkspace?.ref}/secrets`);
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error(
        `Error ${!isEditMode ? "creating" : "updating"} Secret:`,
        error
      );
      setError(
        error.message || `Failed to ${!isEditMode ? "create" : "update"} Secret`
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <PageContainer>
      <PageContainer.Header
        title={!isEditMode ? "Create New Secret" : "Edit Secret"}
        backTo={{
          label: "Back to Secrets",
          onClick: () =>
            router.push(`/workspace/${selectedWorkspace?.ref}/secrets`)
        }}
        actions={
          <Button
            type="submit"
            form={formId}
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {!isEditMode ? "Create Secret" : "Update Secret"}
          </Button>
        }
      />
      <PageContainer.Subheader>
        This secret will be available for use within your Programmable Voice
        Applications vi a the Secrets API.
      </PageContainer.Subheader>
      <PageContainer.ContentForm methods={methods} formId={formId}>
        <InputContext
          name="name"
          label="Secret Name"
          type="text"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-name`}
        />

        <InputContext
          name="secret"
          label="Secret Value"
          type="password"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-secret`}
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
