import {
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import { Layout, PageContainer, Card, Content } from '@/common/components/layout/noAuth/Layout';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InputContext } from '@/common/hooksForm/InputContext';
import { LinkBackTo } from '@stories/linkbackto/LinkBackTo';
import { Button } from '@stories/button/Button';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one symbol'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const theme = useTheme();
  const router = useRouter();
  const { token } = router.query;

  const methods = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    console.log(data);
  };

  return (
    <Layout methods={methods}>
      <PageContainer>
        <Card>
          <Content title="Reset your password">
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 5 }}>
                Please reset your password using 8+ characters with upper, lower,
                number, and symbol.
              </Typography>

              <InputContext
                name="password"
                label="Password"
                type="password"
                id="reset-password"
                helperText="Please enter your new password"
              />

              <Box sx={{ mt: 3 }}>
                <InputContext
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  id="confirm-password"
                  helperText="Please confirm your new password"
                />
              </Box>

              <Box sx={{ textAlign: 'center', mt: 5 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={methods.handleSubmit(onSubmit)}
                >
                  RESET PASSWORD
                </Button>
              </Box>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <LinkBackTo label="Back to forgot password" onClick={() => router.push('/forgot-password')} />
              </Box>
            </form>
          </Content>
        </Card>
      </PageContainer>
    </Layout>
  );
} 