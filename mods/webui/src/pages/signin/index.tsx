import { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  useTheme,
  Stack,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { Layout, PageContainer, Card } from '@/common/components/layout/Layout';
import { useRouter } from 'next/router';
import { Controller, useForm, ControllerRenderProps } from 'react-hook-form';
import { useFonosterClient } from '@/common/hooks/useFonosterClient';
import { Button } from '../../../stories/button/Button';
import { InputText } from '../../../stories/inputtext/InputText';

interface LoginForm {
  email: string;
  password: string;
}

const LoginPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { authentication } = useFonosterClient();
  const { control, handleSubmit, setError, formState: { errors } } = useForm<LoginForm>({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await authentication.signIn({
        username: data.email,
        password: data.password
      });
      router.push('/workspace/list');
    } catch (error) {
      console.log('Error de autenticación:', error);
      setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Error de autenticación'
      });
    }
  };

  const handleSignUpClick = () => {
    router.push('/signup');
  };

  return (
    <Layout>
      <PageContainer>
        <Card onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <Typography variant="h5" align="center">
              Sign In
            </Typography>

            <Controller
              name="email"
              control={control}
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              }}
              render={({ field }: { field: ControllerRenderProps<LoginForm, 'email'> }) => (
                <InputText
                  {...field}
                  label="Email Address"
                  type="email"
                  error={!!errors.email}
                  supportingText={errors.email?.message || 'Please enter your email address'}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              }}
              render={({ field }: { field: ControllerRenderProps<LoginForm, 'password'> }) => (
                <InputText
                  {...field}
                  label="Password"
                  type="password"
                  error={!!errors.password}
                  supportingText={errors.password?.message || 'Please enter your password'}
                />
              )}
            />

            {errors.root && (
              <Typography color="error" variant="body2" align="center">
                {errors.root.message}
              </Typography>
            )}

            <Button
              onClick={handleSubmit(onSubmit)}
              fullWidth
              variant="contained"
              size="large"
            >
              Sign In
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
              startIcon={<GoogleIcon />}
            >
              Sign in with Google
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                display="inline"
              >
                Don't have an account?{' '}
              </Typography>
              <Typography
                variant="body2"
                component="span"
                color="primary"
                onClick={handleSignUpClick}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Sign up here
              </Typography>
            </Box>
          </Stack>
        </Card>
      </PageContainer>
    </Layout>
  );
};

export default LoginPage; 