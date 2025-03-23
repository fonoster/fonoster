import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputContext } from "@/common/hooksForm/InputContext";
import { useAgents } from "@/common/sdk/hooks/useAgents";
import { useDomains } from "@/common/sdk/hooks/useDomains";
import { useRouter } from "next/router";
import PageContainer from "@/common/components/layout/pages";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { Box, Skeleton, CircularProgress } from "@mui/material";
import { Button } from "@stories/button/Button";
import { ErrorType, useNotification } from "@/common/hooks/useNotification";
import { useState, useEffect } from "react";
import { SelectContext } from "@/common/hooksForm/SelectContext";
import { Typography } from "@stories/typography/Typography";
import { Privacy } from "@fonoster/types";
import { useCredential } from "@/common/sdk/hooks/useCredential";
import { ModalTrigger } from "@stories/modaltrigger/ModalTrigger";
import CreateCredentialModal from "@/pages/workspace/[workspaceId]/sip-network/credentials/_components/modal/CreateCredentialModal";

const DESCRIPTION_MAX_WIDTH = "510px";

const agentSchema = z.object({
  ref: z.string().optional(),
  name: z.string().min(1, "Friendly Name is required"),
  username: z.string().min(1, "Username is required"),
  privacy: z.enum([Privacy.PRIVATE, Privacy.NONE]),
  enabled: z.boolean().default(true),
  maxContacts: z.number().min(1, "Max Contacts must be at least 1").default(1),
  expires: z.number().min(1, "Expires must be at least 1").default(3600),
  domainRef: z.string().optional(),
  credentialsRef: z.string().optional(),
  isEditMode: z.boolean().default(false)
});

export type AgentFormData = Omit<z.infer<typeof agentSchema>, "isEditMode">;

interface AgentFormProps {
  initialData?: AgentFormData;
  formId?: string;
  agentId?: string | null;
  isLoading?: boolean;
}

const defaultValues: AgentFormData = {
  ref: undefined,
  name: "",
  username: "",
  privacy: Privacy.NONE,
  enabled: true,
  maxContacts: 1,
  expires: 3600,
  domainRef: undefined,
  credentialsRef: undefined
};

function FormSkeleton({ formId = "agent-form" }: { formId?: string }) {
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
        {/* Friendly Name */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Domain URI */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Username */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Credentials */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Create New Credential button */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={30}
            width={180}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Privacy */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Max Contacts */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Expires */}
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

export default function AgentForm({
  initialData,
  formId = "agent-form",
  agentId,
  isLoading
}: AgentFormProps) {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { createAgent, updateAgent, deleteAgent } = useAgents();
  const { listDomains } = useDomains();
  const { listCredentials } = useCredential();
  const { notifyError, notifySuccess } = useNotification();
  const [domains, setDomains] = useState<{ value: string; label: string }[]>(
    []
  );
  const [credentials, setCredentials] = useState<
    { value: string; label: string }[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);

  const isEditMode = !!agentId;

  const methods = useForm<z.infer<typeof agentSchema>>({
    resolver: zodResolver(agentSchema),
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

  const fetchCredentials = async () => {
    setIsLoadingCredentials(true);
    try {
      const response = await listCredentials();
      if (response && response.items) {
        const credentialOptions = response.items.map((credential) => ({
          value: credential.ref,
          label: credential.name
        }));
        setCredentials(credentialOptions);
      }
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const fetchDomains = async () => {
    setIsLoadingDomains(true);
    try {
      const response = await listDomains();
      if (response && response.items) {
        const domainOptions = response.items.map((domain) => ({
          value: domain.ref,
          label: domain.name
        }));
        setDomains(domainOptions);
      }
    } catch (error) {
      console.error("Error fetching domains:", error);
    } finally {
      setIsLoadingDomains(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
    fetchDomains();
  }, []);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (!isEditMode) {
        const result = await createAgent({
          name: data.name,
          username: data.username,
          privacy: data.privacy,
          enabled: data.enabled,
          maxContacts: data.maxContacts,
          expires: data.expires,
          domainRef: data.domainRef,
          credentialsRef: data.credentialsRef
        });

        if (result) {
          notifySuccess("Agent created successfully");
          router.push(
            `/workspace/${selectedWorkspace?.ref}/sip-network/agents`
          );
        }
      } else {
        const updateData = {
          ref: agentId as string,
          name: data.name,
          privacy: data.privacy,
          enabled: data.enabled,
          maxContacts: data.maxContacts,
          expires: data.expires,
          domainRef: data.domainRef,
          credentialsRef: data.credentialsRef
        };

        const result = await updateAgent(updateData);
        if (result) {
          notifySuccess("Agent updated successfully");
          router.push(
            `/workspace/${selectedWorkspace?.ref}/sip-network/agents`
          );
        }
      }
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  });

  const onDelete = async () => {
    try {
      const result = await deleteAgent(agentId as string);
      if (result) {
        notifySuccess("Agent deleted successfully");
        router.push(`/workspace/${selectedWorkspace?.ref}/sip-network/agents`);
      }
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const handleCredentialSave = async (credential: {
    ref: string;
    name: string;
    username: string;
  }) => {
    notifySuccess(
      `Credential "${credential.name}" created and selected successfully`
    );

    await fetchCredentials();
    methods.setValue("credentialsRef", credential.ref, {
      shouldValidate: true
    });
  };

  if (isLoading) {
    return <FormSkeleton formId={formId} />;
  }

  return (
    <PageContainer>
      <PageContainer.Header
        title={!isEditMode ? "Create New Agent" : "Edit Agent"}
        backTo={{
          label: "Back to agents",
          onClick: () =>
            router.push(
              `/workspace/${selectedWorkspace?.ref}/sip-network/agents`
            )
        }}
        actions={
          <Box sx={{ display: "flex", gap: 2 }}>
            {isEditMode && (
              <Button
                variant="contained"
                disabled={!isValid}
                onClick={onDelete}
              >
                DELETE AGENT
              </Button>
            )}
            <Button variant="contained" disabled={!isValid} onClick={onSubmit}>
              {!isEditMode ? "SAVE AGENT" : "UPDATE AGENT"}
            </Button>
          </Box>
        }
      />

      <Box sx={{ mb: 4, mt: -2, maxWidth: DESCRIPTION_MAX_WIDTH }}>
        <Typography variant="body-small">
          SIP Agents in the same Domain can call each other with Voice Over IP
          using a Software Phone (e.g Zoiper)
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
          size="medium"
        />

        <SelectContext
          name="domainRef"
          label="Domain URI*"
          leadingIcon={null}
          trailingIcon={
            isLoadingDomains ? <CircularProgress size={20} /> : null
          }
          id={`${formId}-domain`}
          options={domains}
          disabled={isLoadingDomains}
        />

        <InputContext
          name="username"
          label="Username*"
          type="text"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-username`}
        />
        <SelectContext
          name="credentialsRef"
          label="Credentials"
          leadingIcon={null}
          trailingIcon={
            isLoadingCredentials ? <CircularProgress size={20} /> : null
          }
          id={`${formId}-credentials`}
          options={credentials}
          disabled={isLoadingCredentials}
        />

        <ModalTrigger
          label="Create New Credential"
          onClick={() => setIsModalOpen(true)}
        />

        <SelectContext
          name="privacy"
          label="Privacy*"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-privacy`}
          options={[
            { value: Privacy.NONE, label: "None" },
            { value: Privacy.PRIVATE, label: "Private" }
          ]}
        />

        <InputContext
          name="maxContacts"
          label="Max Contacts*"
          type="number"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-max-contacts`}
        />

        <InputContext
          name="expires"
          label="Expires (seconds)*"
          type="number"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-expires`}
        />
      </PageContainer.ContentForm>

      <CreateCredentialModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCredentialSave}
      />
    </PageContainer>
  );
}
