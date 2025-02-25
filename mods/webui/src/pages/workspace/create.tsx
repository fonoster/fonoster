import { useState } from 'react';
import {
  Button,
  Typography,
  Container,
  styled,
  Stack,
  Box,
} from '@mui/material';
import { ProgressIndicator } from '../../../stories/progessindicator/ProgressIndicator';
import { useForm, FormProvider } from 'react-hook-form';
import { InputContext } from '@/common/hooksForm/InputContext';
import { SelectContext } from '@/common/hooksForm/SelectContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const WorkspaceContainer = styled(Container)(({ theme }) => ({
  minHeight: `calc(100vh - 80px)`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '1000px !important',
  padding: theme.spacing(3),
}));

const CardContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  width: '100%'
});


const createWorkspaceSchema = z.object({
  workspaceName: z.string().min(1, "Workspace name is required"),
  region: z.string().min(1, "Region is required"),
  apiKey: z.string().optional()
});

const stepValidationSchemas = [
  z.object({ workspaceName: z.string().min(1, "Workspace name is required") }),
  z.object({ region: z.string().min(1, "Region is required") }),
  z.object({ apiKey: z.string().optional() })
];

type FormData = z.infer<typeof createWorkspaceSchema>;

const regions = [
  { value: 'us-east', label: 'US East' },
  { value: 'us-west', label: 'US West' },
  { value: 'eu-central', label: 'EU Central' },
  { value: 'asia-pacific', label: 'Asia Pacific' }
];

const accessRoles = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
  { value: 'viewer', label: 'Viewer' }
];

const steps = [
  'Create workspace',
  'Select region',
  'Copy API Key'
];

const CreateWorkspacePage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [apiKey, setApiKey] = useState('generated-api-key-example');

  const methods = useForm<FormData>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      workspaceName: '',
      region: '',
      apiKey: ''
    },
    mode: 'onChange'
  });

  const { handleSubmit, trigger, watch, formState: { errors } } = methods;

  const validateCurrentStep = async () => {
    const currentStepSchema = stepValidationSchemas[activeStep];
    const currentStepFields = Object.keys(currentStepSchema.shape);
    return await trigger(currentStepFields as any);
  };

  const handleStepSubmit = async (step: number) => {
    try {
      const isValid = await validateCurrentStep();

      if (!isValid) {
        return;
      }

      if (step === 0) {
        // Lógica para crear el workspace
        setActiveStep(1);
        setCurrentProgress(1);
      } else if (step === 1) {
        // Lógica para seleccionar región
        setActiveStep(2);
        setCurrentProgress(2);
      } else if (step === 2) {
        // Lógica final para generar y copiar API key
        // Aquí iría la llamada a tu API para finalizar el proceso
        console.log('Proceso completado');
      }
    } catch (error) {
      console.error('Error en el envío:', error);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <Typography variant="h5" align="center">
              Create a workspace to begin
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Set up your workspace to start managing your queue
            </Typography>

            <InputContext
              id="workspace-create-workspace-name"
              name="workspaceName"
              label="Workspace Name"
              type="text"
              leadingIcon={null}
              trailingIcon={null}
            />

            {errors.workspaceName && (
              <Typography color="error" variant="caption">
                {errors.workspaceName.message}
              </Typography>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => handleStepSubmit(0)}
              id="workspace-create-button-create-workspace"
            >
              Create Workspace
            </Button>
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <Typography variant="h5" align="center">
              Select your region
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Select the region closest to your business operations
            </Typography>

            <SelectContext
              id="workspace-create-region"
              name="region"
              label="Select Region"
              options={regions}
              defaultValue=""
              disabled={false}
            />

            {errors.region && (
              <Typography color="error" variant="caption">
                {errors.region.message}
              </Typography>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => handleStepSubmit(1)}
            >
              Continue
            </Button>
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={3}>
            <Typography variant="h5" align="center">
              Copy API Key
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Store this API key securely. You won't be able to see it again.
            </Typography>

            <InputContext
              id="workspace-create-secret-name"
              name="secretName"
              label="Secret Name"
              type="text"
              leadingIcon={null}
              trailingIcon={null}
            />

            <InputContext
              id="workspace-create-api-key-description"
              name="apiKeyDescription"
              label="API Key Description"
              type="text"
              leadingIcon={null}
              trailingIcon={null}
            />

            <SelectContext
              id="workspace-create-access-role"
              name="accessRole"
              label="Access Role"
              options={accessRoles}
              defaultValue=""
            />

            <Button
              id="workspace-create-button-copy-api-key"
              fullWidth
              variant="contained"
              size="large"
              onClick={() => handleStepSubmit(2)}
            >
              Copy API Key
            </Button>

            <Typography variant="body2" color="text.secondary" align="center">
              Make sure to copy your API key before closing this window
            </Typography>
          </Stack>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <WorkspaceContainer>
      <Box sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        mb: 12,
        mt: 8
      }}>
        <ProgressIndicator
          steps={steps}
          current={currentProgress}
        />
      </Box>
      <CardContainer>
        <FormProvider {...methods}>
          <form onSubmit={(e) => e.preventDefault()}>
            {getStepContent(activeStep)}
          </form>
        </FormProvider>
      </CardContainer>
    </WorkspaceContainer>
  );
};

export default CreateWorkspacePage; 