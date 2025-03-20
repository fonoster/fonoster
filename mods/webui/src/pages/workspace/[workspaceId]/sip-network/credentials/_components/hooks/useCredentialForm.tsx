import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCredential } from "@/common/sdk/hooks/useCredential";
import { ErrorType, useNotification } from "@/common/hooks/useNotification";

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
export const PASSWORD_REQUIREMENTS =
  "8+ characters with upper, lower, number, and symbol";

export const credentialSchema = z
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
      } else if (!PASSWORD_REGEX.test(data.password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: PASSWORD_REQUIREMENTS,
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
      !PASSWORD_REGEX.test(data.password)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PASSWORD_REQUIREMENTS,
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

export const CREDENTIAL_DEFAULTS: CredentialFormData = {
  ref: undefined,
  name: "",
  username: "",
  password: "",
  confirmPassword: ""
};

export interface CredentialFormOptions {
  initialData?: CredentialFormData;
  isEditMode: boolean;
  onSuccess?: (credential: {
    ref: string;
    name: string;
    username: string;
  }) => void;
  credentialId?: string;
}

/**
 * Custom hook for credential form management
 * Handles form validation, submission, and API operations
 */
export const useCredentialForm = ({
  initialData,
  isEditMode,
  onSuccess,
  credentialId
}: CredentialFormOptions) => {
  const { createCredentials, updateCredentials } = useCredential();
  const { notifyError, notifySuccess } = useNotification();

  const methods = useForm<z.infer<typeof credentialSchema>>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      ...(initialData || CREDENTIAL_DEFAULTS),
      isEditMode
    },
    mode: "onChange"
  });

  const {
    handleSubmit,
    reset,
    formState: { isValid }
  } = methods;

  /**
   * Handle form submission
   * Creates a new credential or updates an existing one
   */
  const onSubmit = handleSubmit(async (data) => {
    try {
      if (!isEditMode) {
        const result = await createCredentials({
          name: data.name,
          username: data.username as string,
          password: data.password as string
        });

        notifySuccess("Credential created successfully");

        if (result && onSuccess) {
          onSuccess({
            ref: result.ref,
            name: data.name,
            username: data.username
          });
        }
      } else if (credentialId) {
        const updateData = {
          ref: credentialId,
          name: data.name,
          ...(data.password ? { password: data.password } : {})
        };

        const result = await updateCredentials(updateData);

        if (result) {
          notifySuccess("Credential updated successfully");

          if (onSuccess) {
            onSuccess({
              ref: credentialId,
              name: data.name,
              username: data.username
            });
          }
        }
      }
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  });

  return {
    methods,
    isValid,
    onSubmit,
    reset
  };
};
