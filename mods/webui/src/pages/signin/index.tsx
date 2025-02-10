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
  Link as MuiLink
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { Layout, PageContainer, Card } from '@/common/component/layout/Layout';
import { useRouter } from 'next/router';
import Link from 'next/link';

const LoginPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleSignUpClick = () => {
    router.push('/signup');
  };

  return (
    <Layout>
      <PageContainer>
        <Card onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Typography variant="h5" align="center">
              Sign In
            </Typography>

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              helperText="Please enter your email address"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />

            <Box>
              <TextField
                fullWidth
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Please enter your password"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Link href="/forgot-password" passHref>
                  <MuiLink
                    component="span"
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                        color: 'primary.main',
                      }
                    }}
                  >
                    Forgot password?
                  </MuiLink>
                </Link>
              </Box>
            </Box>

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
              Sign In
            </Button>

            <Box sx={{ 
              position: 'relative', 
              textAlign: 'center',
              my: 2, // Margen arriba y abajo
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