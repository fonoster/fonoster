import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputContext } from "@/common/hooksForm/InputContext";
import { useState } from "react";
import { useCredential } from "@/common/sdk/hooks/useCredential";
import { useRouter } from "next/router";
import { Alert, Snackbar, Button, Typography, Box } from "@mui/material";
import PageContainer from "@/common/components/layout/pages";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";

const credentialSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
    ref: z.string().optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });

const editModeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string(),
  password: z.string(),
  confirmPassword: z.string(),
  ref: z.string().optional()
});

export type CredentialFormData = Omit<
  z.infer<typeof credentialSchema>,
  "confirmPassword"
> & {
  confirmPassword?: string;
};

interface CredentialFormProps {
  initialData?: CredentialFormData;
  formId?: string;
  credentialId?: string | null;
}

export default function CredentialForm({
  initialData,
  formId = "credential-form",
  credentialId
}: CredentialFormProps) {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { createCredentials, updateCredentials } = useCredential();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditMode = !!credentialId;

  const schema = isEditMode ? editModeSchema : credentialSchema;

  const methods = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      username: initialData?.username || "",
      password: initialData?.password || "",
      confirmPassword: initialData?.password || "",
      ref: initialData?.ref || ""
    }
  });

  const handleSubmit = methods.handleSubmit(async (data) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!isEditMode) {
        const result = await createCredentials({
          name: data.name,
          username: data.username,
          password: data.password
        });

        if (result) {
          setSuccess("Credential created successfully");
          setTimeout(() => {
            router.push(
              `/workspace/${selectedWorkspace?.ref}/sip-network/credentials`
            );
          }, 1500);
        }
      } else {
        const result = await updateCredentials({
          ref: credentialId as string,
          name: data.name
        });

        if (result) {
          setSuccess("Credential updated successfully");
          setTimeout(() => {
            router.push(
              `/workspace/${selectedWorkspace?.ref}/sip-network/credentials`
            );
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error(
        `Error ${!isEditMode ? "creating" : "updating"} Credential:`,
        error
      );
      setError(
        error.message ||
          `Failed to ${!isEditMode ? "create" : "update"} Credential`
      );
    } finally {
      setIsSubmitting(false);
    }
  });

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
          <Button
            type="submit"
            form={formId}
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {!isEditMode ? "Create Credential" : "Update Credential"}
          </Button>
        }
      />
      <PageContainer.Subheader>
        Create a new credential to protect your Agent or Trunk.
      </PageContainer.Subheader>
      <PageContainer.ContentForm methods={methods} formId={formId}>
        <InputContext
          name="name"
          label="Credential Name"
          type="text"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-name`}
        />

        {!isEditMode ? (
          <>
            <InputContext
              name="username"
              label="Username"
              type="text"
              leadingIcon={null}
              trailingIcon={null}
              id={`${formId}-username`}
            />

            <InputContext
              name="password"
              label="Password"
              type="password"
              leadingIcon={null}
              trailingIcon={null}
              id={`${formId}-password`}
            />

            <InputContext
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              leadingIcon={null}
              trailingIcon={null}
              id={`${formId}-confirm-password`}
            />
          </>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Username
              </Typography>
              <Typography variant="body1">
                {initialData?.username || ""}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                Username cannot be changed after creation
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Password
              </Typography>
              <Typography variant="body1">••••••••</Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                Password cannot be changed after creation
              </Typography>
            </Box>
          </>
        )}

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
