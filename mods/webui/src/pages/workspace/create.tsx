import { useState } from 'react';
import {
  Button,
  Typography,
  Container,
  styled,
  Stack,
  Paper,
  Box,
} from '@mui/material';
import { Layout } from '@/common/components/layout/Layout';
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
  marginTop: 80,
  maxWidth: '1000px !important',
  padding: theme.spacing(3),
}));

const CardContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  width: '100%'
});

const VerifyCard = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 530,
  margin: 'auto',
  padding: theme.spacing(6),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.palette.mode === 'light'
    ? '0px 3px 15px rgba(0, 0, 0, 0.1)'
    : '0px 3px 15px rgba(0, 0, 0, 0.4)',
  transition: theme.transitions.create(['box-shadow']),
  '&:hover': {
    boxShadow: theme.palette.mode === 'light'
      ? '0px 4px 20px rgba(0, 0, 0, 0.15)'
      : '0px 4px 20px rgba(0, 0, 0, 0.5)',
  },
}));

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
  const currentValues = watch();

  const validateCurrentStep = async () => {
    const currentStepFields = Object.keys(stepValidationSchemas[activeStep].shape);
    
    const isValid = await trigger(currentStepFields as any);
    return isValid;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const isValid = await validateCurrentStep();
      
      if (!isValid) {
        return;
      }

      if (activeStep === steps.length - 1) {
      } else {
        handleNext();
      }
    } catch (error) {
      console.error('Error in onSubmit:', error);
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
              onClick={handleNext}
            >
              Create Workspace
            </Button>

            <Typography variant="caption" color="text.secondary">
              Current value: {currentValues.workspaceName || 'empty'}
            </Typography>
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
              name="region"
              label="Select Region"
              options={regions}
              defaultValue=""
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleNext}
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
              name="secretName"
              label="Secret Name"
              type="text"
              leadingIcon={null}
              trailingIcon={null}
            />

            <InputContext
              name="apiKeyDescription"
              label="API Key Description"
              type="text"
              leadingIcon={null}
              trailingIcon={null}
            />

            <SelectContext
              name="accessRole"
              label="Access Role"
              options={accessRoles}
              defaultValue=""
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit(onSubmit)}
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
    <Layout>
      <WorkspaceContainer>
        <Box sx={{ width: '100%', maxWidth: 600, mb: 12, mt: 8 }}>
          <ProgressIndicator 
            steps={steps}
            current={activeStep}
          />
        </Box>
        <CardContainer>
          <VerifyCard>
            <FormProvider {...methods}>
              <form onSubmit={(e) => e.preventDefault()}>
                {getStepContent(activeStep)}
              </form>
            </FormProvider>
          </VerifyCard>
        </CardContainer>
      </WorkspaceContainer>
    </Layout>
  );
};

export default CreateWorkspacePage; 