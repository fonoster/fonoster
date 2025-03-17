import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputContext } from "@/common/hooksForm/InputContext";
import { useACL } from "@/common/sdk/hooks/useACL";
import { useRouter } from "next/router";
import PageContainer from "@/common/components/layout/pages";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { Box, Skeleton } from "@mui/material";
import { Button } from "@stories/button/Button";
import { ErrorType, useNotification } from "@/common/hooks/useNotification";
import { useState } from "react";
import CreateRuleModal from "../modal/CreateRuleModal";
import { SelectContext } from "@/common/hooksForm/SelectContext";
import { ModalTrigger } from "@stories/modaltrigger/ModalTrigger";

const aclSchema = z
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

export type ACLsFormData = Omit<z.infer<typeof aclSchema>, "isEditMode">;

interface ACLsFormProps {
  initialData?: ACLsFormData;
  formId?: string;
  aclId?: string | null;
  isLoading?: boolean;
}

const defaultValues: ACLsFormData = {
  ref: undefined,
  name: "",
  allow: [],
  deny: []
};

function FormSkeleton({ formId = "acl-form" }: { formId?: string }) {
  return (
    <PageContainer>
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

        <Box sx={{ mt: 4 }}>
          <Skeleton variant="text" width={80} height={24} />
        </Box>
      </Box>
    </PageContainer>
  );
}

export default function ACLsForm({
  initialData,
  formId = "acl-form",
  aclId,
  isLoading
}: ACLsFormProps) {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { createAcl, updateAcl } = useACL();
  const { notifyError, notifySuccess, NotificationComponent } =
    useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isEditMode = !!aclId;

  const methods = useForm<z.infer<typeof aclSchema>>({
    resolver: zodResolver(aclSchema),
    defaultValues: {
      ...(initialData || defaultValues),
      isEditMode
    },
    mode: "onChange"
  });

  const {
    formState: { isValid },
    handleSubmit,
    setValue,
    watch
  } = methods;
  const allow = watch("allow");
  const deny = watch("deny");

  if (isLoading) {
    return <FormSkeleton formId={formId} />;
  }

  const handleAddRule = (rule: {
    ipOrCIDR: string;
    category: "Allow" | "Deny";
  }) => {
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
      } else {
        const result = await updateAcl({
          ref: data.ref as string,
          name: data.name,
          allow: data.allow,
          deny: data.deny
        });

        notifySuccess("ACL updated successfully");
      }
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  });

  return (
    <PageContainer>
      <NotificationComponent />
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

        <ModalTrigger label="Add Rule" onClick={() => setIsModalOpen(true)} />
      </PageContainer.ContentForm>
      <CreateRuleModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddRule}
      />
    </PageContainer>
  );
}
