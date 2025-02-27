import { useState } from 'react';
import {
  Button,
  Typography,
  Container,
  styled,
  Stack,
  Box,
  TextField,
  IconButton,
  InputAdornment,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { ProgressIndicator } from '../../../stories/progessindicator/ProgressIndicator';
import { useForm, FormProvider } from 'react-hook-form';
import { InputContext } from '@/common/hooksForm/InputContext';
import { SelectContext } from '@/common/hooksForm/SelectContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWorkspaces } from '@/common/sdk/hooks/useWorkspaces';
import { useAPIKey } from '@/common/sdk/hooks/useAPIKey';
import { Role } from '@fonoster/types';
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

const combinedSchema = z.object({
  workspaceName: z.string().optional(),
  region: z.string().optional(),
  apiKey: z.string().optional(),
  secretName: z.string().optional(),
  apiKeyDescription: z.string().optional(),
  accessRole: z.string().optional()
});

const regions = [
  { value: 'NYC01', label: 'NYC01' }
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
const deafultRegion = { value: process.env.NEXT_PUBLIC_FONOSTER_REGION || 'NYC01', label: process.env.NEXT_PUBLIC_FONOSTER_REGION || 'NYC01' };

const CreateWorkspacePage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [apiKeySecret, setApiKeySecret] = useState('');
  const [isApiKeyGenerated, setIsApiKeyGenerated] = useState(false);
  const { createWorkspace } = useWorkspaces();
  const { createAPIKey } = useAPIKey();

  const methods = useForm({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      workspaceName: '',
      region: '',
      apiKey: '',
      secretName: '',
      apiKeyDescription: '',
      accessRole: ''
    },
    mode: 'onChange'
  });

  const { handleSubmit, trigger, watch, formState: { errors } } = methods;

  const validateCurrentStep = async () => {
    // All steps are optional now, so we always return true
    return true;
  };

  const handleStepSubmit = async (step: number) => {
    try {
      const isValid = await validateCurrentStep();
      const data = methods.getValues();

      if (step === 0) {
        if (data.workspaceName) {
          await createWorkspace({
            name: data.workspaceName
          });
        }
        setActiveStep(1);
        setCurrentProgress(1);
      } else if (step === 1) {
        // if (data.region) {
        //   await createRegion({
        //     region: data.region
        //   });
        // }
        setActiveStep(2);
        setCurrentProgress(2);
      } else if (step === 2) {
        if (!isApiKeyGenerated && data.secretName) {
          const result = await createAPIKey({
            name: data.secretName,
            description: data.apiKeyDescription || '',
            role: data.accessRole as Role
          });

          if (result) {
            setApiKey(result.apiKey);
            setApiKeySecret(result.apiSecret);
            setIsApiKeyGenerated(true);
          }
        }
      }
    } catch (error) {
      console.error('Error en el envío:', error);
    }
  };

  const skipStep = (step: number) => {
    if (step === 0) {
      setActiveStep(1);
      setCurrentProgress(1);
    } else if (step === 1) {
      setActiveStep(2);
      setCurrentProgress(2);
    } else if (step === 2) {
      console.log('Proceso completado');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography
                variant="body2"
                color="primary"
                sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => skipStep(0)}
              >
                Skip step
              </Typography>
            </Box>
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
              defaultValue={deafultRegion}
              disabled={true}
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

            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography
                variant="body2"
                color="primary"
                sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => skipStep(1)}
              >
                Skip step
              </Typography>
            </Box>
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={3}>
            <Typography variant="h5" align="center">
              {isApiKeyGenerated ? 'Copy API Key' : 'Generate API Key'}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {isApiKeyGenerated
                ? 'Store this API key securely. You won\'t be able to see it again.'
                : 'Fill in the details to generate your API key.'}
            </Typography>

            {!isApiKeyGenerated ? (
              <>
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
                  defaultValue="admin"
                />

                <Button
                  id="workspace-create-button-generate-api-key"
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => handleStepSubmit(2)}
                >
                  Generate API Key
                </Button>
              </>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="API Key"
                  value={apiKey}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => copyToClipboard(apiKey)}
                          aria-label="copy api key"
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  margin="normal"
                />

                <TextField
                  fullWidth
                  label="API Secret"
                  value={apiKeySecret}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => copyToClipboard(apiKeySecret)}
                          aria-label="copy api secret"
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  margin="normal"
                />

                <Typography variant="body2" color="error" align="center">
                  Make sure to copy your API key and secret before closing this window. You won't be able to see them again.
                </Typography>
              </>
            )}

            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography
                variant="body2"
                color="primary"
                sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => skipStep(2)}
              >
                Skip step
              </Typography>
            </Box>
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