import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputContext } from "@/common/hooksForm/InputContext";
import { useDomains } from "@/common/sdk/hooks/useDomains";
import { useRouter } from "next/router";
import PageContainer from "@/common/components/layout/pages";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { Box, Skeleton } from "@mui/material";
import { Button } from "@stories/button/Button";
import { ErrorType, useNotification } from "@/common/hooks/useNotification";
import { useEffect, useState } from "react";
import AddEgressRuleModal from "../modal/AddEgressRuleModal";
import { ModalTrigger } from "@stories/modaltrigger/ModalTrigger";
import { ChipsContext } from "@/common/hooksForm/ChipsContext";
import { Typography } from "@stories/typography/Typography";
import { useNumbers } from "@/common/sdk/hooks/useNumbers";

const DESCRIPTION_MAX_WIDTH = "510px";

const getEgressRuleDisplayValue = (rule: {
  rule: string;
  numberRef: string;
}): string => {
  return `${rule.rule} → ${rule.numberRef}`;
};

const domainSchema = z.object({
  ref: z.string().optional(),
  name: z.string().min(1, "Friendly Name is required"),
  domainUri: z
    .string()
    .min(1, "Domain URI is required")
    .regex(
      /^(?:(?:[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*(?:[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])$/,
      "Domain URI must be a valid domain format (e.g., example.com)"
    ),
  egressRules: z
    .array(
      z.object({
        rule: z.string(),
        numberRef: z.string()
      })
    )
    .default([]),
  isEditMode: z.boolean().default(false)
});

export type DomainFormData = Omit<z.infer<typeof domainSchema>, "isEditMode">;

interface DomainFormProps {
  initialData?: DomainFormData;
  formId?: string;
  domainId?: string | null;
  isLoading?: boolean;
}

const defaultValues: DomainFormData = {
  ref: undefined,
  name: "",
  domainUri: "",
  egressRules: []
};

function FormSkeleton({ formId = "domain-form" }: { formId?: string }) {
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
      </Box>
    </PageContainer>
  );
}

export default function DomainForm({
  initialData,
  formId = "domain-form",
  domainId,
  isLoading
}: DomainFormProps) {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { createDomain, updateDomain } = useDomains();
  const { listNumbers } = useNumbers();
  const { notifyError, notifySuccess, NotificationComponent } =
    useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [outboundNumbers, setOutboundNumbers] = useState<
    { value: string; label: string }[]
  >([]);

  const isEditMode = !!domainId;

  const methods = useForm<z.infer<typeof domainSchema>>({
    resolver: zodResolver(domainSchema),
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
  const egressRules = watch("egressRules") || [];

  const fetchNumbers = async () => {
    const response = await listNumbers({});
    console.log("response numbers", response);
    const items = response?.items;
    setOutboundNumbers(
      items?.map((item) => ({
        value: item.ref,
        label: item.ref
      })) || []
    );
  };

  useEffect(() => {
    fetchNumbers();
  }, []);

  const handleAddEgressRule = (data: { rule: string; numberRef: string }) => {
    const newEgressRules = [...egressRules, data];
    setValue("egressRules", newEgressRules, { shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (!isEditMode) {
        const result = await createDomain({
          name: data.name,
          domainUri: data.domainUri,
          egressPolicies: data.egressRules
        });

        notifySuccess("Domain created successfully");
      } else {
        const updateData: any = {
          ref: domainId as string,
          domainUri: data.domainUri,
          name: data.name,
          egressPolicies: data.egressRules
        };

        const result = await updateDomain(updateData);
        notifySuccess("Domain updated successfully");
      }
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  });

  if (isLoading) {
    return <FormSkeleton formId={formId} />;
  }

  return (
    <PageContainer>
      <NotificationComponent />
      <PageContainer.Header
        title={!isEditMode ? "Create New Domain" : "Edit Domain"}
        backTo={{
          label: "Back to domains",
          onClick: () =>
            router.push(
              `/workspace/${selectedWorkspace?.ref}/sip-network/domains`
            )
        }}
        actions={
          <Button variant="contained" disabled={!isValid} onClick={onSubmit}>
            {!isEditMode ? "SAVE DOMAIN" : "UPDATE DOMAIN"}
          </Button>
        }
      />

      <Box sx={{ mb: 4, mt: -2, maxWidth: DESCRIPTION_MAX_WIDTH }}>
        <Typography variant="body-small">
          Create a new domain to manage your internal communications. A SIP
          Domain will group several SIP Agents (e.g. office, home, etc.)
        </Typography>
      </Box>

      <PageContainer.ContentForm methods={methods} formId={formId}>
        <InputContext
          name="name"
          label="Friendly Name*"
          type="text"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-name`}
        />

        <InputContext
          name="domainUri"
          label="Domain URI*"
          type="text"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-domain-uri`}
        />

        <ChipsContext
          name="egressRules"
          label="Egress Rules"
          placeholder="Add egress rules"
          transformValue={(value) => ({
            value,
            label: getEgressRuleDisplayValue(value)
          })}
        />

        <ModalTrigger
          label="Add Egress Rule"
          onClick={() => setIsModalOpen(true)}
        />
      </PageContainer.ContentForm>

      <AddEgressRuleModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddEgressRule}
        outboundNumbers={outboundNumbers}
        existingRules={egressRules}
      />
    </PageContainer>
  );
}
