import {
  Box,
  useTheme,
  Link as MuiLink,
  Typography
} from '@mui/material';
import Link from 'next/link';
import router, { useRouter } from 'next/router';
import { Layout, PageContainer, Card, Content } from '@/common/components/layout/noAuth/Layout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputContext } from '@/common/hooksForm/InputContext';
import { z } from 'zod';
import { LinkBackTo } from '@stories/linkbackto/LinkBackTo';
import { Button } from '@stories/button/Button';

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;


const TempResetButton = () => {
  const router = useRouter();

  const handleClick = () => {
    try {
      router.push({
        pathname: '/forgot-password/[token]',
        query: { token: '1257' }
      });
    } catch (error) {
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
  const theme = useTheme();
  const methods = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    console.log(data);
  };

  return (
    <Layout methods={methods}>
      <PageContainer>
        <Card>
          <Content title="Forgot Password?">
            <form onSubmit={methods.handleSubmit(onSubmit)}>

              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 5 }}>
                Enter the email associated with your account and we'll send you a link
                to reset your password.
              </Typography>

              <InputContext
                name="email"
                label="Email Address"
                type="email"
                id="forgot-password-email"
                helperText="Please enter your email address"
              />

              <Box sx={{ textAlign: 'center', mt: 5 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={methods.handleSubmit(onSubmit)}
                >
                  SEND ME A RESET LINK
                </Button>
              </Box>
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <TempResetButton />
              </Box>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <LinkBackTo label="Back to sign in" onClick={() => router.push('/forgot-password')} />
              </Box>
            </form>
          </Content>
        </Card>
      </PageContainer>
    </Layout>
  );
} 