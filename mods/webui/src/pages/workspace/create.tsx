import { useState } from 'react';
import {
  Button,
  TextField,
  Typography,
  Container,
  styled,
  useTheme,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Box,
  StepConnector,
  stepConnectorClasses,
  StepIconProps,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import Check from '@mui/icons-material/Check';
import { Layout } from '@/common/components/layout/Layout';

const WorkspaceContainer = styled(Container)(({ theme }) => ({
  minHeight: `calc(100vh - 80px)`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: 80,
  maxWidth: '1000px !important',
  padding: theme.spacing(3),
}));

const StepperContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 600,
  marginBottom: theme.spacing(12),
  marginTop: theme.spacing(8),
  '& .MuiStepLabel-label': {
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  '& .MuiStepLabel-root': {
    flexDirection: 'column',
    '& .MuiStepLabel-labelContainer': {
      marginTop: theme.spacing(1),
    },
  },
  '& .step-description': {
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    marginTop: theme.spacing(0.5),
  },
  '& .MuiStepConnector-line': {
    minHeight: 2,
  },
  '& .MuiStepIcon-root': {
    width: 28,
    height: 28,
    cursor: 'pointer',
  },
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

const CustomConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 14,
    left: 'calc(-50% + 14px)',
    right: 'calc(50% + 14px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.mode === 'light' 
      ? theme.palette.grey[300] 
      : theme.palette.grey[800],
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

const CustomStepIconRoot = styled('div')<{ ownerState: { active?: boolean } }>(
  ({ theme, ownerState }) => ({
    color: theme.palette.mode === 'light' 
      ? theme.palette.grey[300] 
      : theme.palette.grey[800],
    display: 'flex',
    height: 22,
    alignItems: 'center',
    ...(theme.palette.mode === 'dark' && {
      color: theme.palette.grey[700],
    }),
    '& .StepIcon-completedIcon': {
      color: theme.palette.primary.main,
      zIndex: 1,
      fontSize: 18,
    },
    '& .StepIcon-circle': {
      width: 8,
      height: 8,
      borderRadius: '50%',
      backgroundColor: 'currentColor',
    },
    ...(ownerState.active && {
      color: theme.palette.primary.main,
    }),
  }),
);

const CustomStepIcon = (props: StepIconProps) => {
  const { active, completed, className } = props;

  return (
    <CustomStepIconRoot ownerState={{ active }} className={className}>
      {completed ? (
        <Check className="StepIcon-completedIcon" />
      ) : (
        <div className="StepIcon-circle" />
      )}
    </CustomStepIconRoot>
  );
};

const steps = [
  {
    label: 'Create workspace',
    description: 'Set up your workspace name'
  },
  {
    label: 'Select region',
    description: 'Choose your region'
  },
  {
    label: 'Copy API Key',
    description: 'Get your API credentials'
  }
];

const CreateWorkspacePage = () => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState('');
  const [region, setRegion] = useState('');
  const [apiKey, setApiKey] = useState('generated-api-key-example');

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleStepClick = (step: number) => {
    if (step <= activeStep + 1) {
      setActiveStep(step);
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

            <TextField
              fullWidth
              label="Workspace Name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              variant="outlined"
              placeholder="Enter your workspace name"
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleNext}
              disabled={!workspaceName}
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

            <FormControl fullWidth>
              <InputLabel>Select Region</InputLabel>
              <Select
                value={region}
                label="Select Region"
                onChange={(e) => setRegion(e.target.value)}
              >
                <MenuItem value="us-east">US East</MenuItem>
                <MenuItem value="us-west">US West</MenuItem>
                <MenuItem value="eu-central">EU Central</MenuItem>
                <MenuItem value="asia-pacific">Asia Pacific</MenuItem>
              </Select>
            </FormControl>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleNext}
              disabled={!region}
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

            <TextField
              fullWidth
              label="Secret Key"
              value={apiKey}
              variant="outlined"
              InputProps={{
                readOnly: true,
              }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => navigator.clipboard.writeText(apiKey)}
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
        <StepperContainer>
          <Stepper 
            alternativeLabel 
            activeStep={activeStep} 
            connector={<CustomConnector />}
          >
            {steps.map((step, index) => (
              <Step key={step.label} onClick={() => handleStepClick(index)}>
                <StepLabel StepIconComponent={CustomStepIcon}>
                  <Typography className="step-description">
                    {step.label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </StepperContainer>
        <CardContainer>
          <VerifyCard>
            {getStepContent(activeStep)}
          </VerifyCard>
        </CardContainer>
      </WorkspaceContainer>
    </Layout>
  );
};

export default CreateWorkspacePage; 