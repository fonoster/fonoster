import { useEffect, useState } from "react";
import { Button, Typography, Skeleton } from "@mui/material";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import PageContainer from "@/common/components/layout/pages";
import { InputContext } from "@/common/hooksForm/InputContext";
import { SelectContext } from "@/common/hooksForm/SelectContext";
import { useWorkspaces } from "@/common/sdk/hooks/useWorkspaces";
import { Workspace } from "@fonoster/types";

const { ContentForm } = PageContainer;

const timezones = [
  { value: "UTC", label: "UTC" },
  { value: "PST: UTC-8:00", label: "PST: UTC-8:00" },
  { value: "EST: UTC-5:00", label: "EST: UTC-5:00" }
];

interface WorkspaceFormData extends Workspace {
  timezone: {
    value: string;
    label: string;
  };
}

const FormSkeleton = () => {
  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <Skeleton variant="text" width={60} height={20} sx={{ mb: 1 }} />

      <Skeleton variant="text" width={200} height={32} sx={{ mb: 3 }} />

      <div style={{ marginBottom: "24px" }}>
        <Skeleton variant="text" width={120} height={20} sx={{ mb: 1 }} />{" "}
        <Skeleton variant="rounded" height={40} />
      </div>

      <div style={{ marginBottom: "24px" }}>
        <Skeleton variant="text" width={80} height={20} sx={{ mb: 1 }} />{" "}
        <Skeleton variant="rounded" height={40} />
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const { getWorkspace, updateWorkspace } = useWorkspaces();
  const router = useRouter();
  const { workspaceId } = router.query;
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const methods = useForm<WorkspaceFormData>({
    defaultValues: {
      name: "",
      timezone: timezones[0],
      ref: ""
    }
  });

  useEffect(() => {
    if (workspaceId) {
      const loadSettings = async () => {
        setIsLoading(true);
        try {
          const settings = await getWorkspace(workspaceId as string);
          const currentTimezone =
            timezones.find((tz) => tz.value === settings?.timezone) ||
            timezones[0];

          methods.reset({
            name: settings?.name || "",
            ref: settings?.ref || "",
            timezone: currentTimezone
          });
          setName(settings?.name || "");
        } catch (error) {
          console.error("Error loading settings:", error);
        } finally {
          setIsLoading(false);
        }
      };
      loadSettings();
    }
  }, [workspaceId, methods]);

  const onSubmit = async (data: WorkspaceFormData) => {
    try {
      const submitData = {
        ...data,
        timezone: data.timezone.value
      };
      await updateWorkspace(workspaceId as string, submitData);
      setName(data.name);
    } catch (error) {
      console.error("Error updating workspace:", error);
    }
  };

  return (
    <PageContainer>
      <PageContainer.Header
        title="Workspace Settings"
        backTo={{
          label: "Back to Overview",
          onClick: () => router.push(`/workspace/${workspaceId}/overview`)
        }}
        actions={
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading}
          >
            Save Settings
          </Button>
        }
      />
      <div style={{ transition: "opacity 0.3s ease" }}>
        {isLoading ? (
          <FormSkeleton />
        ) : (
          <ContentForm methods={methods} formId="settings-form">
            <Typography variant="caption">NYC01</Typography>
            <Typography variant="h6">{name}</Typography>

            <InputContext
              name="name"
              label="Workspace Name"
              type="text"
              leadingIcon={null}
              trailingIcon={null}
              id="settings-form-name"
            />

            <SelectContext
              name="timezone"
              label="Timezone"
              options={timezones}
              defaultValue={timezones[0].value}
              id="settings-form-timezone"
            />
          </ContentForm>
        )}
      </div>
    </PageContainer>
  );
}
