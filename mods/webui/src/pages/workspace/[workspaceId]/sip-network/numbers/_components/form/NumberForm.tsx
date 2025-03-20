import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputContext } from "@/common/hooksForm/InputContext";
import { useNumbers } from "@/common/sdk/hooks/useNumbers";
import { useTrunks } from "@/common/sdk/hooks/useTrunks";
import { useRouter } from "next/router";
import PageContainer from "@/common/components/layout/pages";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { Box, Skeleton, CircularProgress } from "@mui/material";
import { Button } from "@stories/button/Button";
import { ErrorType, useNotification } from "@/common/hooks/useNotification";
import { useState, useEffect } from "react";
import { SelectContext } from "@/common/hooksForm/SelectContext";
import { Typography } from "@stories/typography/Typography";
import { useApplications } from "@/common/sdk/hooks/useApplications";

const DESCRIPTION_MAX_WIDTH = "510px";

const numberSchema = z.object({
  ref: z.string().optional(),
  name: z.string().min(1, "Friendly Name is required"),
  telUrl: z.string().min(1, "Tel URL is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  countryIsoCode: z.string().min(1, "Country ISO Code is required"),
  trunkRef: z.string().optional(),
  appRef: z.string().optional(),
  agentAor: z.string().optional(),
  isEditMode: z.boolean().default(false)
});

export type NumberFormData = Omit<z.infer<typeof numberSchema>, "isEditMode">;

interface NumberFormProps {
  initialData?: NumberFormData;
  formId?: string;
  numberId?: string | null;
  isLoading?: boolean;
}

const defaultValues: NumberFormData = {
  ref: undefined,
  name: "",
  telUrl: "",
  city: "",
  country: "",
  countryIsoCode: "",
  trunkRef: undefined,
  appRef: undefined,
  agentAor: undefined
};
const countries = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "MX", label: "Mexico" },
  { value: "GB", label: "United Kingdom" }
];

function FormSkeleton({ formId = "number-form" }: { formId?: string }) {
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

        {/* Trunk */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Tel URL */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Country */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* City */}
        <Box sx={{ mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={40}
            width={440}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Application */}
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

export default function NumberForm({
  initialData,
  formId = "number-form",
  numberId,
  isLoading
}: NumberFormProps) {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { createNumber, updateNumber, deleteNumber } = useNumbers();
  const { listTrunks } = useTrunks();
  const { listApplications } = useApplications();
  const { notifyError, notifySuccess } = useNotification();
  const [trunks, setTrunks] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingTrunks, setIsLoadingTrunks] = useState(false);
  const [applications, setApplications] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);

  const isEditMode = !!numberId;

  const methods = useForm<z.infer<typeof numberSchema>>({
    resolver: zodResolver(numberSchema),
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

  const fetchTrunks = async () => {
    setIsLoadingTrunks(true);
    try {
      const response = await listTrunks();
      if (response && response.items) {
        const trunkOptions = response.items.map((trunk: any) => ({
          value: trunk.ref,
          label: trunk.name
        }));
        setTrunks(trunkOptions);
      }
      return true;
    } catch (error) {
      console.error("Error fetching trunks:", error);
      return false;
    } finally {
      setIsLoadingTrunks(false);
    }
  };

  const fetchApplications = async () => {
    setIsLoadingApplications(true);
    try {
      const response = await listApplications();
      if (response && response.items) {
        const applicationOptions = response.items.map((application: any) => ({
          value: application.ref,
          label: application.name
        }));
        setApplications(applicationOptions);
      }
      return true;
    } catch (error) {
      console.error("Error fetching applications:", error);
      return false;
    } finally {
      setIsLoadingApplications(false);
    }
  };

  useEffect(() => {
    fetchTrunks();
    fetchApplications();
  }, []);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (!isEditMode) {
        const result = await createNumber({
          name: data.name,
          telUrl: data.telUrl,
          city: data.city,
          country: data.country,
          countryIsoCode: data.countryIsoCode,
          trunkRef: data.trunkRef,
          appRef: data.appRef,
          agentAor: data.agentAor
        });
        notifySuccess("Number created successfully");
      } else {
        const updateData = {
          ref: numberId as string,
          name: data.name,
          trunkRef: data.trunkRef,
          appRef: data.appRef,
          agentAor: data.agentAor
        };
        const result = await updateNumber(updateData);
        notifySuccess("Number updated successfully");
      }
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  });

  const onDelete = async () => {
    try {
      const result = await deleteNumber(numberId as string);
      notifySuccess("Number deleted successfully");
      setTimeout(() => {
        router.push(`/workspace/${selectedWorkspace?.ref}/sip-network/numbers`);
      }, 1000);
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  if (isLoading) {
    return <FormSkeleton formId={formId} />;
  }

  return (
    <PageContainer>
      <PageContainer.Header
        title={!isEditMode ? "Create New Number" : "Edit Number"}
        backTo={{
          label: "Back to numbers",
          onClick: () =>
            router.push(
              `/workspace/${selectedWorkspace?.ref}/sip-network/numbers`
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
                DELETE NUMBER
              </Button>
            )}
            <Button variant="contained" disabled={!isValid} onClick={onSubmit}>
              {!isEditMode ? "SAVE NUMBER" : "UPDATE NUMBER"}
            </Button>
          </Box>
        }
      />

      <Box sx={{ mb: 4, mt: -2, maxWidth: DESCRIPTION_MAX_WIDTH }}>
        <Typography variant="body-small">
          Add a new number to handle incoming and outgoing calls. Use this
          section to manage your numbers and control their settings.
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
          name="trunkRef"
          label="Trunk*"
          leadingIcon={null}
          trailingIcon={isLoadingTrunks ? <CircularProgress size={20} /> : null}
          id={`${formId}-trunk`}
          options={trunks}
          disabled={isLoadingTrunks}
        />

        <SelectContext
          name="country"
          label="Country*"
          leadingIcon={null}
          id={`${formId}-country`}
          options={countries}
        />

        <InputContext
          name="city"
          label="City*"
          type="text"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-city`}
        />

        <InputContext
          name="telUrl"
          label="Tel URL*"
          type="text"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-tel-url`}
        />

        <SelectContext
          name="appRef"
          label="Select Inbound Application"
          leadingIcon={null}
          trailingIcon={
            isLoadingApplications ? <CircularProgress size={20} /> : null
          }
          id={`${formId}-app-ref`}
          options={applications}
          disabled={isLoadingApplications}
        />
      </PageContainer.ContentForm>
    </PageContainer>
  );
}
