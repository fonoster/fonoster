import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import { GitHub as GitHubIcon } from '@mui/icons-material';
import { Layout, PageContainer, Card, Content } from '@/common/components/layout/noAuth/Layout';
import { useRouter } from 'next/router';
import { ModalTerms } from '@stories/modalterms/ModalTerms';
import { useForm } from 'react-hook-form';
import { InputContext } from '@/common/hooksForm/InputContext';
import { CheckboxContext } from '@/common/hooksForm/CheckboxContext';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@stories/button/Button';
import { useUser } from '@/common/sdk/hooks/useUser';

const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      'Password must contain uppercase, lowercase, number and symbol'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type SignUpFormData = z.infer<typeof signUpSchema>;

const SignUpPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const [openTerms, setOpenTerms] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { createUser, isReady } = useUser();

  const methods = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    }
  });

  const handleTermsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpenTerms(true);
  };

  const handleCloseTerms = () => {
    setOpenTerms(false);
  };

  const onSubmit = async (data: SignUpFormData) => {
    if (!isReady) return;

    try {
      setIsRedirecting(true);
      await createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        avatar: ''
      });
      router.push('/signup/verify');
    } catch (error) {
      alert('An error occurred during registration');
    }
  };

  const handleGitHubSignUp = () => {
    router.push('/signup/verify');
  };

  const watchAgreeToTerms = methods.watch('agreeToTerms');
  useEffect(() => {
    if (watchAgreeToTerms) {
      setOpenTerms(true);
    }
  }, [watchAgreeToTerms]);

  return (
    <Layout methods={methods}>
      <PageContainer>
        <Card onSubmit={methods.handleSubmit(onSubmit)}>
          <Content title="Sign up for Fonoster">
            <InputContext
              name="name"
              label="Name"
              id="name"
              helperText="Please enter your name"
            />

            <InputContext
              name="email"
              label="Email Address"
              type="email"
              id="email"
              helperText="Please enter your email address"
            />

            <InputContext
              name="password"
              label="Password"
              type="password"
              id="password"
              helperText="8+ characters with upper, lower, number, and symbol"
            />

            <InputContext
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              helperText="Please confirm your password"
            />

            <CheckboxContext
              name="agreeToTerms"
              label={
                <Typography variant="body2">
                  Agree to the{' '}
                  <Typography
                    component="span"
                    variant="body2"
                    color="primary"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline',
                      }
                    }}
                    onClick={handleTermsClick}
                  >
                    terms and conditions
                  </Typography>
                </Typography>
              }
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{
                boxShadow: theme.shadows[2],
                '&:hover': {
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              SIGN UP
            </Button>

            <Box sx={{
              position: 'relative',
              textAlign: 'center',
              my: 2,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '1px',
                backgroundColor: theme.palette.mode === 'light'
                  ? 'rgba(0, 0, 0, 0.12)'
                  : 'rgba(255, 255, 255, 0.12)',
              }
            }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  position: 'relative',
                  display: 'inline-block',
                  px: 2,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                Or
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<GitHubIcon />}
              onClick={handleGitHubSignUp}
              disabled={isRedirecting}
            >
              Sign in with GitHub
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="body2"
                color="text.secondary"
                display="inline"
              >
                Already have an account?{' '}
              </Typography>
              <Typography
                variant="body2"
                component="span"
                color="primary"
                onClick={() => router.push('/signin')}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Sign in
              </Typography>
            </Box>
          </Content>
        </Card>
      </PageContainer>

      <ModalTerms
        open={openTerms}
        onClose={handleCloseTerms}
        title="Terms and Conditions"
        message={`
          Welcome to Fonoster! These Terms and Conditions govern your use of our services.
          
          1. Acceptance of Terms
          By accessing and using our services, you agree to be bound by these terms.
          
          2. Privacy Policy
          Your privacy is important to us. Please review our Privacy Policy to understand how we collect and use your information.
          
          3. User Responsibilities
          You are responsible for maintaining the security of your account and any activities that occur under your account.
          
          4. Service Usage
          Our services are provided "as is" and we make no warranties about their availability or functionality.
          
          5. Intellectual Property
          All content and materials available through our services are protected by intellectual property rights.
          
          6. Termination
          We reserve the right to terminate or suspend access to our services at our discretion.
          
          7. Changes to Terms
          We may modify these terms at any time. Continued use of our services constitutes acceptance of any changes.
          
          By clicking "Agree", you confirm that you have read and agree to these terms.
        `}
      />
    </Layout>
  );
};

export default SignUpPage; 