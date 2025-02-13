import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
  Stack,
  Link as MuiLink
} from '@mui/material';
import { Layout, PageContainer, Card } from '@/common/components/layout/Layout';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ResetPassword() {
  console.log('Rendering ResetPassword page with token');
  const theme = useTheme();
  const router = useRouter();
  const { token } = router.query;

  // // Mostrar un loading state mientras el token no esté disponible
  // if (!token) {
  //   return (
  //     <>
  //       <Header />
  //       <LoginContainer>
  //         <Typography>Loading...</Typography>
  //       </LoginContainer>
  //     </>
  //   );
  // }

  console.log('Reset Password Page - Token:', token);

  return (
    <>
      <Layout>
      <PageContainer>
        <Card>
          <Stack spacing={3}>
            <Typography variant="h5" align="center">
              Reset your password
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Please reset your password using 8+ characters with upper, lower,
              number, and symbol.
            </Typography>

            <TextField
              fullWidth
              label="Password"
              type="password"
              autoComplete="new-password"
              helperText="Please enter your new password"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              helperText="Please confirm your new password"
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
              RESET PASSWORD
            </Button>

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
    </>
  );
} 