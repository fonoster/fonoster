import { useEffect, useState } from 'react';
import { Button, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import PageContainer from '@/common/components/layout/pages';
import { InputContext } from '@/common/hooksForm/InputContext';
import { SelectContext } from '@/common/hooksForm/SelectContext';
import { useWorkspaces } from '@/common/sdk/hooks/useWorkspaces';
import { Workspace } from '@fonoster/types';

const { ContentForm } = PageContainer;

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'PST: UTC-8:00', label: 'PST: UTC-8:00' },
  { value: 'EST: UTC-5:00', label: 'EST: UTC-5:00' },
];

export default function SettingsPage() {
  const { isReady, getWorkspace } = useWorkspaces();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const router = useRouter();
  const { workspaceId } = router.query;
  const methods = useForm({
    defaultValues: {
      name: '',
      timezone: 'PST: UTC-8:00'
    }
  });


  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (workspaceId) {
      const loadSettings = async () => {
        try {
          // const settings = await getWorkspaceSettings(workspaceId);
          // reset(settings);
        } catch (error) {
        }
      };
      loadSettings();
    }
  }, [workspaceId, reset]);

  const onSubmit = async (data) => {
    try {
      // await updateWorkspaceSettings(workspaceId, data);
    } catch (error) {
    }
  };

  return (
    <PageContainer>
      <PageContainer.Header title="Workspace Settings"
        backTo={{
          label: 'Back to Overview',
          onClick: () => router.push(`/workspace/${workspaceId}/overview`)
        }}
        actions={
          <Button
            type="submit"
            variant="contained"
            color="primary"
          >
            Save Settings
          </Button>
        }
      />
      <ContentForm methods={methods} formId="settings-form">
        <Typography variant="caption" >
          NYC01
        </Typography>
        <Typography variant="h6">
          [Workspace Name]
        </Typography>

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
          defaultValue={process.env.NEXT_PUBLIC_FONOSTER_REGION}
          id="settings-form-timezone"
        />
      </ContentForm>
    </PageContainer>
  );
} 