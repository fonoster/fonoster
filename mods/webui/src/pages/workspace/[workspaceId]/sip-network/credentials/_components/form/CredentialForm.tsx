import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputContext } from "@/common/hooksForm/InputContext";
import { useCredential } from "@/common/sdk/hooks/useCredential";
import { useRouter } from "next/router";
import PageContainer from "@/common/components/layout/pages";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { Box, Skeleton } from "@mui/material";

import { Button } from "@stories/button/Button";
import { ErrorType, useNotification } from "@/common/hooks/useNotification";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
const passwordMessage =
  "Password must have 8+ characters with upper, lower, number, and symbol";

const credentialSchema = z
  .object({
    ref: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    isEditMode: z.boolean().default(false)
  })
  .superRefine((data, ctx) => {
    if (!data.isEditMode) {
      if (!data.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password is required",
          path: ["password"]
        });
      } else if (!passwordRegex.test(data.password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: passwordMessage,
          path: ["password"]
        });
      }

      if (!data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Confirm password is required",
          path: ["confirmPassword"]
        });
      }
    }

    if (data.password && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords don't match",
        path: ["confirmPassword"]
      });
    }

    if (
      data.isEditMode &&
      data.password &&
      !passwordRegex.test(data.password)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: passwordMessage,
        path: ["password"]
      });
    }
  });

export type CredentialFormData = Omit<
  z.infer<typeof credentialSchema>,
  "confirmPassword" | "isEditMode"
> & {
  confirmPassword?: string;
};

interface CredentialFormProps {
  initialData?: CredentialFormData;
  formId?: string;
  credentialId?: string | null;
  isLoading?: boolean;
}

const defaultValues: CredentialFormData = {
  ref: undefined,
  name: "",
  username: "",
  password: "",
  confirmPassword: ""
};

function FormSkeleton({ formId = "credential-form" }: { formId?: string }) {
  return (
    <PageContainer>
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

      <Box sx={{ px: 3, mb: 8 }}>
        <Skeleton variant="text" width={350} height={20} />
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

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

export default function CredentialForm({
  initialData,
  formId = "credential-form",
  credentialId,
  isLoading
}: CredentialFormProps) {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { createCredentials, updateCredentials } = useCredential();
  const { notifyError, notifySuccess } = useNotification();

  const isEditMode = !!credentialId;

  const methods = useForm<z.infer<typeof credentialSchema>>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      ...(initialData || defaultValues),
      isEditMode
    },
    mode: "onChange"
  });
  const {
    formState: { isValid },
    handleSubmit
  } = methods;

  if (isLoading) {
    return <FormSkeleton formId={formId} />;
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (!isEditMode) {
        const result = await createCredentials({
          name: data.name,
          username: data.username as string,
          password: data.password as string
        });

        notifySuccess("Credential created successfully");

        if (result) {
          setTimeout(() => {
            router.push(
              `/workspace/${selectedWorkspace?.ref}/sip-network/credentials`
            );
          }, 1500);
        }
      } else {
        const updateData: any = {
          ref: credentialId as string,
          name: data.name
        };

        if (data.password) {
          updateData.password = data.password;
        }

        const result = await updateCredentials(updateData);
        notifySuccess("Credential updated successfully");
        if (result) {
          setTimeout(() => {
            router.push(
              `/workspace/${selectedWorkspace?.ref}/sip-network/credentials`
            );
          }, 1500);
        }
      }
    } catch (error: any) {
      notifyError(error as ErrorType);
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
          <Button variant="contained" disabled={!isValid} onClick={onSubmit}>
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
          helperText="8+ characters with upper, lower, number, and symbol."
        />
      </PageContainer.ContentForm>
    </PageContainer>
  );
}
