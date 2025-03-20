import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useACL } from "@/common/sdk/hooks/useACL";
import { ErrorType, useNotification } from "@/common/hooks/useNotification";

export const aclSchema = z
  .object({
    ref: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    allow: z.array(z.string()).default([]),
    deny: z.array(z.string()).default([]),
    isEditMode: z.boolean().default(false)
  })
  .superRefine((data, ctx) => {
    if (!data.isEditMode) {
      if (
        (!data.allow || data.allow.length === 0) &&
        (!data.deny || data.deny.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one network rule (allow or deny) is required",
          path: ["allow"]
        });
      }
    }
  });

export type ACLFormData = Omit<z.infer<typeof aclSchema>, "isEditMode">;

export const ACL_DEFAULTS: ACLFormData = {
  ref: undefined,
  name: "",
  allow: [],
  deny: []
};

export type NetworkRule = {
  ipOrCIDR: string;
  category: "Allow" | "Deny";
};

export interface ACLFormOptions {
  initialData?: ACLFormData;
  isEditMode: boolean;
  onSuccess?: (acl: { ref: string; name: string }) => void;
  aclId?: string;
}

/**
 * Custom hook for ACL form management
 * Handles form validation, submission, and API operations
 */
export const useACLForm = ({
  initialData,
  isEditMode,
  onSuccess,
  aclId
}: ACLFormOptions) => {
  const { createAcl, updateAcl } = useACL();
  const { notifyError, notifySuccess } = useNotification();

  const methods = useForm<z.infer<typeof aclSchema>>({
    resolver: zodResolver(aclSchema),
    defaultValues: {
      ...(initialData || ACL_DEFAULTS),
      isEditMode
    },
    mode: "onChange"
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isValid }
  } = methods;

  const allow = watch("allow");
  const deny = watch("deny");

  const addRule = (rule: NetworkRule) => {
    if (rule.category === "Allow") {
      const newNetworks = [...allow, rule.ipOrCIDR];
      setValue("allow", newNetworks, { shouldValidate: true });
    } else {
      const newNetworks = [...deny, rule.ipOrCIDR];
      setValue("deny", newNetworks, { shouldValidate: true });
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (!isEditMode) {
        const result = await createAcl({
          name: data.name,
          allow: data.allow,
          deny: data.deny
        });

        notifySuccess("ACL created successfully");

        if (result && onSuccess) {
          onSuccess({
            ref: result.ref,
            name: data.name
          });
        }
      } else if (aclId) {
        const result = await updateAcl({
          ref: aclId,
          name: data.name,
          allow: data.allow,
          deny: data.deny
        });

        notifySuccess("ACL updated successfully");

        if (result && onSuccess) {
          onSuccess({
            ref: aclId,
            name: data.name
          });
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
    addRule,
    allow,
    deny
  };
};
