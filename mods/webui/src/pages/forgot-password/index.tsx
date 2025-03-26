import { Box, CircularProgress } from "@mui/material";
import { useRouter } from "next/router";
import {
  Layout,
  PageContainer,
  Card,
  Content
} from "@/common/components/layout/noAuth/Layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputContext } from "@/common/hooksForm/InputContext";
import { z } from "zod";
import { Button } from "@stories/button/Button";
import { useUser } from "@/common/sdk/hooks/useUser";
import { useEffect, useState } from "react";
import { useNotification } from "@/common/hooks/useNotification";
import { Link } from "@/common/components";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
});

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { sendResetPasswordCode } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { notifySuccess, notifyError, NotificationComponent } =
    useNotification();

  useEffect(() => {
    const { code } = router.query;
    if (code && typeof code === "string") {
      router.push({
        pathname: "/forgot-password/[code]",
        query: { code: code }
      });
    }
  }, [router.query, router]);

  const methods = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsLoading(true);

      await sendResetPasswordCode(data.email);
      notifySuccess(
        `Password reset link sent to ${data.email}. You can now close this page, go to your inbox, and follow the instructions to reset your password.`,
        {
          duration: 8000,
          position: { vertical: "top", horizontal: "center" }
        }
      );

      methods.reset();
    } catch (error: any) {
      notifyError({
        code: error?.code || "SEND_RESET_CODE_ERROR",
        message:
          error?.message || "Failed to send reset link. Please try again later."
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
          <Content
            title="Forgot Password?"
            description="Enter the email associated with your account and we'll send you a link to reset your password."
          >
            <InputContext
              name="email"
              label="Email Address"
              type="email"
              id="forgot-password-email"
              helperText="Please enter your email address"
            />

            <Box style={{ textAlign: "center", marginTop: "35px" }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={methods.handleSubmit(onSubmit)}
                disabled={isLoading}
                startIcon={
                  isLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : null
                }
              >
                {isLoading ? "SENDING RESET LINK..." : "SEND ME A RESET LINK"}
              </Button>
            </Box>

            <Box style={{ textAlign: "center", marginTop: "16px" }}>
              <Link href="/signin" label="Back to sign in" />
            </Box>
          </Content>
        </Card>
      </PageContainer>
    </Layout>
  );
}
