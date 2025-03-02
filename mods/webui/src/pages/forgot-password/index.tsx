import {
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { useRouter } from 'next/router';
import { Layout, PageContainer, Card, Content } from '@/common/components/layout/noAuth/Layout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputContext } from '@/common/hooksForm/InputContext';
import { z } from 'zod';
import { LinkBackTo } from '@stories/linkbackto/LinkBackTo';
import { Button } from '@stories/button/Button';
import { useUser } from '@/common/sdk/hooks/useUser';
import { useEffect, useState } from 'react';
import { useNotification } from '@/common/hooks/useNotification';

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { sendResetPasswordCode } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const { notifySuccess, notifyError, NotificationComponent } = useNotification();

  useEffect(() => {
    const { code } = router.query;
    if (code && typeof code === 'string') {
      router.push({
        pathname: '/forgot-password/[code]',
        query: { code: code }
      });
    }
  }, [router.query, router]);

  const methods = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsLoading(true);

      const result = await sendResetPasswordCode(data.email);
      notifySuccess(`Password reset link sent to ${data.email}. Please check your inbox and follow the instructions to reset your password.`, {
        duration: 8000,
        position: { vertical: 'top', horizontal: 'center' }
      });

      setResetSuccess(true);
      methods.reset();
    } catch (error: any) {
      notifyError({
        code: error?.code || 'SEND_RESET_CODE_ERROR',
        message: error?.message || 'Failed to send reset link. Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout methods={methods}>
      <NotificationComponent />
      <PageContainer>
        <Card>
          <Content title="Forgot Password?">
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
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isLoading ? 'SENDING RESET LINK...' : 'SEND ME A RESET LINK'}
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <LinkBackTo label="Back to sign in" onClick={() => router.push('/signin')} />
            </Box>
          </Content>
        </Card>
      </PageContainer>
    </Layout>
  );
} 