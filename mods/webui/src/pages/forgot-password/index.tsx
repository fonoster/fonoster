import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
  Stack,
  Link as MuiLink
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Layout, PageContainer, Card } from '@/common/component/layout/Layout';

const TempResetButton = () => {
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await router.push({
        pathname: '/forgot-password/[token]',
        query: { token: '1257' }
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <Button
      onClick={handleClick}
      fullWidth
      variant="outlined"
      size="large"
    >
      Temp: Go to Reset Password
    </Button>
  );
};

export default function ForgotPassword() {
  console.log('Rendering ForgotPassword index page');
  const theme = useTheme();

  return (
    <Layout>
      <PageContainer>
        <Card>
          <Stack spacing={3}>
            <Typography variant="h5" align="center">
              Forgot Password?
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Enter the email associated with your account and we'll send you a link
              to reset your password.
            </Typography>

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              autoComplete="email"
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
              SEND ME A RESET LINK
            </Button>

            {/* Nuevo componente para el botón temporal */}
            <TempResetButton />

            <Box sx={{ textAlign: 'center' }}>
              <Link href="/signin" passHref>
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
                  Back to sign in
                </MuiLink>
              </Link>
            </Box>
          </Stack>
        </Card>
      </PageContainer>
    </Layout>
  );
} 