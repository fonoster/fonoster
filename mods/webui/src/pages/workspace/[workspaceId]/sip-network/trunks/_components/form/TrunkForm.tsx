import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageContainer from "@/common/components/layout/pages";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { Box, Skeleton, CircularProgress } from "@mui/material";
import { Button } from "@stories/button/Button";
import { InputContext } from "@/common/hooksForm/InputContext";
import { SelectContext } from "@/common/hooksForm/SelectContext";
import { useCredential } from "@/common/sdk/hooks/useCredential";
import { useTrunks } from "@/common/sdk/hooks/useTrunks";
import { ErrorType, useNotification } from "@/common/hooks/useNotification";
import { CheckboxContext } from "@/common/hooksForm/CheckboxContext";
import { useACL } from "@/common/sdk/hooks/useACL";
import { ModalTrigger } from "@stories/modaltrigger/ModalTrigger";
import CreateCredentialModal from "@/pages/workspace/[workspaceId]/sip-network/credentials/_components/modal/CreateCredentialModal";
import { CredentialData } from "@/pages/workspace/[workspaceId]/sip-network/credentials/_components/modal/CreateCredentialModal";
import CreateACLModal from "@/pages/workspace/[workspaceId]/sip-network/acls/_components/modal/CreateACLModal";
import { ACLData } from "@/pages/workspace/[workspaceId]/sip-network/acls/_components/modal/CreateACLModal";
import { Typography } from "@stories/typography/Typography";
import CreateTrunkURIModal from "../modal/CreateTrunkURIModal";
import { TrunkURIData } from "../modal/CreateTrunkURIModal";
import { ChipData, ChipsContext } from "@/common/hooksForm/ChipsContext";
import { Transport } from "../hooks/useTrunkURIForm";

const DESCRIPTION_MAX_WIDTH = "510px";
const SECTION_HEADER_STYLES = { textTransform: "uppercase" as const };
const DESCRIPTION_STYLES = { mt: -2, maxWidth: DESCRIPTION_MAX_WIDTH };

const trunkSchema = z.object({
  ref: z.string().optional(),
  name: z.string().min(1, "Friendly Name is required"),
  inboundUri: z.string().min(1, "Inbound URI is required"),
  sendRegister: z.boolean().default(false),
  accessControlListRef: z.string().nullable().optional(),
  inboundCredentialsRef: z.string().nullable().optional(),
  outboundCredentialsRef: z.string().nullable().optional(),
  uris: z
    .array(
      z.object({
        value: z.object({
          host: z.string(),
          port: z.number(),
          transport: z.nativeEnum(Transport),
          weight: z.number(),
          priority: z.number(),
          enabled: z.boolean(),
          user: z.string().optional()
        }),
        label: z.string()
      })
    )
    .default([])
});

export type TrunkFormData = z.infer<typeof trunkSchema>;

const TRUNK_DEFAULTS: TrunkFormData = {
  ref: undefined,
  name: "",
  inboundUri: "",
  sendRegister: false,
  accessControlListRef: undefined,
  inboundCredentialsRef: undefined,
  outboundCredentialsRef: undefined,
  uris: []
};

/**
 * Props for the TrunkForm component
 */
interface TrunkFormProps {
  initialData?: TrunkFormData & { uris?: TrunkURIData[] };

  formId?: string;

  trunkId?: string | undefined;

  isLoading?: boolean;
}

/**
 * Skeleton component shown during loading states
 */
function FormSkeleton({ formId = "trunk-form" }: { formId?: string }) {
  return (
    <PageContainer>
      {/* Header skeleton */}
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

      {/* Subheader skeleton */}
      <Box sx={{ px: 3, mb: 8 }}>
        <Skeleton variant="text" width={350} height={20} />
      </Box>

      {/* Form fields skeleton */}
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
            height={30}
            width={220}
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
            height={30}
            width={220}
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
            height={30}
            width={220}
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

        {/* Create Outbound SIP URI button */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={30}
            width={220}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Send Register */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={24}
            width={150}
            sx={{ borderRadius: 1 }}
          />
        </Box>
      </Box>
    </PageContainer>
  );
}

/**
 * Main component for creating or editing SIP trunks
 *
 * This component provides a full-page form for trunk management,
 * with support for both creating new trunks and editing existing ones.
 */
export default function TrunkForm({
  initialData,
  formId = "trunk-form",
  trunkId,
  isLoading
}: TrunkFormProps) {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { createTrunk, updateTrunk, deleteTrunk } = useTrunks();
  const { listCredentials } = useCredential();
  const { listAcls } = useACL();
  const { notifyError, notifySuccess, NotificationComponent } =
    useNotification();

  const [credentials, setCredentials] = useState<
    { ref: string; name: string }[]
  >([]);
  const [acls, setAcls] = useState<{ ref: string; name: string }[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [isLoadingAcls, setIsLoadingAcls] = useState(false);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isACLModalOpen, setIsACLModalOpen] = useState(false);
  const [isTrunkURIModalOpen, setIsTrunkURIModalOpen] = useState(false);
  const [currentCredentialType, setCurrentCredentialType] = useState<
    "inbound" | "outbound"
  >("inbound");

  const isEditMode = !!trunkId;

  const formInitialData = initialData
    ? {
        ...TRUNK_DEFAULTS,
        ...initialData,
        uris: initialData.uris || []
      }
    : TRUNK_DEFAULTS;

  const methods = useForm<TrunkFormData & { uris: ChipData<TrunkURIData>[] }>({
    resolver: zodResolver(trunkSchema),
    defaultValues: formInitialData,
    mode: "onChange"
  });

  const {
    formState: { isValid },
    handleSubmit,
    setValue
  } = methods;

  const convertNullToUndefined = (
    value: string | null | undefined
  ): string | undefined => {
    return value === null ? undefined : value;
  };

  const formatURILabel = (uri: TrunkURIData) => {
    return `${uri.host}:${uri.port} (${uri.transport})${uri.enabled ? "" : " (disabled)"}`;
  };

  const transformURIToChip = (uri: TrunkURIData): ChipData<TrunkURIData> => ({
    value: uri,
    label: formatURILabel(uri)
  });

  const getURISelectOptions = (values: ChipData<TrunkURIData>[]) => {
    return values.map((chip) => ({
      value: chip.value,
      label: chip.label
    }));
  };

  const handleTrunkURISave = (uri: TrunkURIData) => {
    const newUri = transformURIToChip(uri);
    const currentUris = methods.getValues("uris") || [];
    setValue("uris", [...currentUris, newUri], { shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const apiURIs = data.uris.map((uri) => uri.value);

      if (!isEditMode) {
        await createTrunk({
          name: data.name,
          inboundUri: data.inboundUri,
          sendRegister: data.sendRegister,
          accessControlListRef: convertNullToUndefined(
            data.accessControlListRef
          ),
          inboundCredentialsRef: convertNullToUndefined(
            data.inboundCredentialsRef
          ),
          outboundCredentialsRef: convertNullToUndefined(
            data.outboundCredentialsRef
          ),
          uris: apiURIs
        });

        notifySuccess("Trunk created successfully");
      } else {
        await updateTrunk({
          ref: data.ref as string,
          name: data.name,
          inboundUri: data.inboundUri,
          sendRegister: data.sendRegister,
          accessControlListRef: convertNullToUndefined(
            data.accessControlListRef
          ),
          inboundCredentialsRef: convertNullToUndefined(
            data.inboundCredentialsRef
          ),
          outboundCredentialsRef: convertNullToUndefined(
            data.outboundCredentialsRef
          ),
          uris: apiURIs
        });
        notifySuccess("Trunk updated successfully");
      }
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  });

  const onDelete = async () => {
    try {
      if (trunkId) {
        await deleteTrunk(trunkId);
        notifySuccess("Trunk deleted successfully");
        router.push(`/workspace/${selectedWorkspace?.ref}/sip-network/trunks`);
      }
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const handleCredentialSave = async (credential: CredentialData) => {
    const success = await fetchCredentials();

    if (success) {
      const createdCred = credentials.find(
        (c) => c.name === credential.username
      );

      if (createdCred) {
        if (currentCredentialType === "inbound") {
          setValue("inboundCredentialsRef", createdCred.ref, {
            shouldValidate: true
          });
        } else {
          setValue("outboundCredentialsRef", createdCred.ref, {
            shouldValidate: true
          });
        }
      }
    }
  };

  const handleACLSave = async (acl: ACLData) => {
    const success = await fetchAcls();

    if (success) {
      const createdAcl = acls.find((a) => a.name === acl.name);

      if (createdAcl) {
        setValue("accessControlListRef", createdAcl.ref, {
          shouldValidate: true
        });
      }
    }
  };

  const fetchCredentials = async () => {
    setIsLoadingCredentials(true);
    try {
      const response = await listCredentials({});
      const items = response?.items;

      if (items && Array.isArray(items)) {
        setCredentials(
          items.map((cred) => ({
            ref: cred.ref,
            name: cred.name
          }))
        );
      }
      return true;
    } catch (error) {
      console.error("Error fetching credentials:", error);
      return false;
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const fetchAcls = async () => {
    setIsLoadingAcls(true);
    try {
      const response = await listAcls({});
      const items = response?.items;

      if (items && Array.isArray(items)) {
        setAcls(
          items.map((acl) => ({
            ref: acl.ref,
            name: acl.name
          }))
        );
      }

      return true;
    } catch (error) {
      console.error("Error fetching ACLs:", error);
      return false;
    } finally {
      setIsLoadingAcls(false);
    }
  };

  useMemo(() => {
    fetchCredentials();
    fetchAcls();
  }, []);

  if (isLoading) {
    return <FormSkeleton formId={formId} />;
  }

  return (
    <PageContainer>
      <NotificationComponent />
      <PageContainer.Header
        title={!isEditMode ? "Create New Trunk" : "Edit Trunk"}
        backTo={{
          label: "Back to Trunks",
          onClick: () =>
            router.push(
              `/workspace/${selectedWorkspace?.ref}/sip-network/trunks`
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
                DELETE TRUNK
              </Button>
            )}
            <Button variant="contained" disabled={!isValid} onClick={onSubmit}>
              {!isEditMode ? "SAVE SIP TRUNK" : "UPDATE SIP TRUNK"}
            </Button>
          </Box>
        }
      />

      <Box sx={{ mb: 6, mt: -2, maxWidth: DESCRIPTION_MAX_WIDTH }}>
        <Typography variant="body-small">
          Add to your Project a SIP Provider to make and receive calls from
          regular phones. Complete the following form with the information given
          to you by your service provider.
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

        <Typography variant="mono-medium" sx={SECTION_HEADER_STYLES}>
          INBOUND
        </Typography>

        <Typography variant="body-micro" sx={DESCRIPTION_STYLES}>
          Outgoing traffic from your communications infrastructure to the PSTN.
          In order to use a Trunk for termination it must have a Termination SIP
          URI and at least one authentication scheme (IP Access Control Lists
          and/or Credential Lists).
        </Typography>

        <InputContext
          name="inboundUri"
          label="Inbound SIP URI*"
          type="text"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-inbound-uri`}
        />

        <SelectContext
          name="accessControlListRef"
          label="Access Control List*"
          leadingIcon={null}
          trailingIcon={isLoadingAcls ? <CircularProgress size={20} /> : null}
          id={`${formId}-accessControlListRef`}
          disabled={isLoadingAcls}
          options={acls.map((acl) => ({
            value: acl.ref,
            label: acl.name
          }))}
        />
        <ModalTrigger
          label="Create New Access Control List"
          onClick={() => setIsACLModalOpen(true)}
        />

        <SelectContext
          name="inboundCredentialsRef"
          label="Inbound Credentials*"
          leadingIcon={null}
          trailingIcon={
            isLoadingCredentials ? <CircularProgress size={20} /> : null
          }
          id={`${formId}-inboundCredentialsRef`}
          disabled={isLoadingCredentials}
          options={credentials.map((cred) => ({
            value: cred.ref,
            label: cred.name
          }))}
        />
        <ModalTrigger
          label="Create New Inbound Control List"
          onClick={() => {
            setCurrentCredentialType("inbound");
            setIsCredentialModalOpen(true);
          }}
        />

        <Typography variant="mono-medium" sx={SECTION_HEADER_STYLES}>
          OUTBOUND
        </Typography>

        <Typography variant="body-micro" sx={DESCRIPTION_STYLES}>
          Outgoing traffic from your communications infrastructure to the PSTN.
          In order to use a Trunk for termination it must have a Termination SIP
          URI and at least one authentication scheme (IP Access Control Lists
          and/or Credential Lists).
        </Typography>

        <SelectContext
          name="outboundCredentialsRef"
          label="Outbound Credentials"
          leadingIcon={null}
          trailingIcon={
            isLoadingCredentials ? <CircularProgress size={20} /> : null
          }
          id={`${formId}-outboundCredentialsRef`}
          disabled={isLoadingCredentials}
          options={credentials.map((cred) => ({
            value: cred.ref,
            label: cred.name
          }))}
        />

        <ModalTrigger
          label="Create New Outbound Credentials"
          onClick={() => {
            setCurrentCredentialType("outbound");
            setIsCredentialModalOpen(true);
          }}
        />

        <Typography
          variant="mono-medium"
          sx={{ ...SECTION_HEADER_STYLES, mt: 4 }}
        >
          OUTBOUND SIP URIS
        </Typography>

        <Typography variant="body-micro" sx={DESCRIPTION_STYLES}>
          Define the SIP URIs for outbound connections to your provider. You can
          add multiple URIs with different priorities and weights for load
          balancing.
        </Typography>

        <ChipsContext<TrunkURIData>
          name="uris"
          label="Outbound SIP URIs"
          getSelectOptions={getURISelectOptions}
          transformValue={transformURIToChip}
          placeholder="Add SIP URIs"
        />

        <ModalTrigger
          label="Create Outbound SIP URI"
          onClick={() => setIsTrunkURIModalOpen(true)}
        />

        <CheckboxContext
          name="sendRegister"
          label="Send Register"
          id={`${formId}-sendRegister`}
        />
      </PageContainer.ContentForm>

      <CreateCredentialModal
        open={isCredentialModalOpen}
        onClose={() => setIsCredentialModalOpen(false)}
        onSave={handleCredentialSave}
        title={`Create ${currentCredentialType === "inbound" ? "Inbound" : "Outbound"} Credential`}
      />

      <CreateACLModal
        open={isACLModalOpen}
        onClose={() => setIsACLModalOpen(false)}
        onSave={handleACLSave}
        title="Create Access Control List"
      />

      <CreateTrunkURIModal
        open={isTrunkURIModalOpen}
        onClose={() => setIsTrunkURIModalOpen(false)}
        onSave={handleTrunkURISave}
        existingUris={methods.getValues("uris") || []}
      />
    </PageContainer>
  );
}
