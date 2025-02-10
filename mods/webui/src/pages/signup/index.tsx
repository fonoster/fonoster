import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  styled,
  useTheme,
  Stack,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { Layout, PageContainer, Card } from '@/common/component/layout/Layout';
import { useRouter } from 'next/router';

const SignUpPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms) {
      // Aquí puedes implementar tu sistema de notificaciones
      alert('Please agree to the terms and conditions');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      // Aquí iría la lógica de registro
      router.push('/signup/verify');
    } catch (error) {
      alert('An error occurred during registration');
    }
  };

  return (
    <Layout>
      <PageContainer>
        <Card onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Typography variant="h5" align="center">
              Sign up for Fonoster
            </Typography>

            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              helperText="Please enter your name"
              required
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              helperText="Please enter your email address"
              required
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              helperText="8+ characters with upper, lower, number, and symbol"
              required
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              helperText="Please confirm your password"
              required
              variant="outlined"
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  color="primary"
                />
              }
              label="Agree to the terms and conditions"
            />

            <Button
              type="submit"
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
              startIcon={<GoogleIcon />}
            >
              Sign up with Google
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
          </Stack>
        </Card>
      </PageContainer>
    </Layout>
  );
};

export default SignUpPage; 