import { useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useForm, FormProvider } from 'react-hook-form';
import { useRouter } from 'next/router';
import { InputContext } from '@/common/hooksForm/InputContext';
import { SelectContext } from '@/common/hooksForm/SelectContext.tsx';
import { useWorkspaces } from '@/common/sdk/hooks/useWorkspaces';

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'PST: UTC-8:00', label: 'PST: UTC-8:00' },
  { value: 'EST: UTC-5:00', label: 'EST: UTC-5:00' },
];

export default function SettingsPage() {
  const { isReady, getWorkspace } = useWorkspaces();
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
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Workspace Settings
      </Typography>
      
      <FormProvider {...methods}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>

          <InputContext
            name="name"
            label="Workspace Name"
            type="text"
            leadingIcon={null}
            trailingIcon={null}
          />
          
          <SelectContext
            name="timezone"
            label="Timezone"
            options={timezones}
            defaultValue={process.env.NEXT_PUBLIC_FONOSTER_REGION}
          />
          
          <Button 
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            fullWidth
          >
            Save Settings
          </Button>
        </Box>
      </FormProvider>
    </Box>
  );
} 