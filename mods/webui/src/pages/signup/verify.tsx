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
  StepIconProps
} from '@mui/material';
import Check from '@mui/icons-material/Check';
import { Header } from '@/common/component/layout/Layout';

const VerifyContainer = styled(Container)(({ theme }) => ({
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
  ({ theme }) => ({
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
    ...(({ ownerState }) => ownerState.active && {
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
    label: 'Verify email address',
    description: 'Verify email address'
  },
  {
    label: 'Verify phone number',
    description: 'Verify phone number'
  },
  {
    label: 'Complete',
    description: 'Verification Complete'
  }
];

const VerifyPage = () => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
  const [isPhoneCodeSent, setIsPhoneCodeSent] = useState(false);
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [phoneResendTimer, setPhoneResendTimer] = useState(0);

  const startResendTimer = (setTimer: React.Dispatch<React.SetStateAction<number>>) => {
    setTimer(30);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendEmailCode = () => {
    setIsEmailCodeSent(true);
    startResendTimer(setEmailResendTimer);
  };

  const handleSendPhoneCode = () => {
    setIsPhoneCodeSent(true);
    startResendTimer(setPhoneResendTimer);
  };

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
              Verify your account
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Please enter your email address to receive a verification code.
            </Typography>

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="outlined"
            />

            {!isEmailCodeSent ? (
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSendEmailCode}
              >
                Send Verification Code
              </Button>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Verification Code"
                  value={emailVerificationCode}
                  onChange={(e) => setEmailVerificationCode(e.target.value)}
                  variant="outlined"
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleNext}
                >
                  Verify Code
                </Button>

                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Didn't receive the code?
                  </Typography>
                  {emailResendTimer > 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Send again in {emailResendTimer} seconds
                    </Typography>
                  ) : (
                    <Typography
                      variant="body2"
                      color="primary"
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                        }
                      }}
                      onClick={handleSendEmailCode}
                    >
                      Send again
                    </Typography>
                  )}
                </Stack>
              </>
            )}
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <Typography variant="h5" align="center">
              Verify your phone number
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Please enter your phone number to receive a verification code.
            </Typography>

            <TextField
              fullWidth
              label="Phone Number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              variant="outlined"
            />

            {!isPhoneCodeSent ? (
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSendPhoneCode}
              >
                Send Code
              </Button>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Verification Code"
                  value={phoneVerificationCode}
                  onChange={(e) => setPhoneVerificationCode(e.target.value)}
                  variant="outlined"
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleNext}
                >
                  Verify Code
                </Button>

                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Didn't receive the code?
                  </Typography>
                  {phoneResendTimer > 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Send again in {phoneResendTimer} seconds
                    </Typography>
                  ) : (
                    <Typography
                      variant="body2"
                      color="primary"
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                        }
                      }}
                      onClick={handleSendPhoneCode}
                    >
                      Send again
                    </Typography>
                  )}
                </Stack>
              </>
            )}
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={3}>
            <Typography variant="h5" align="center">
              Verification Complete
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Your account has been successfully verified.
              You can now access all features of your account.
            </Typography>
          </Stack>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <>
      <Header />
      <VerifyContainer>
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
      </VerifyContainer>
    </>
  );
};

export default VerifyPage; 