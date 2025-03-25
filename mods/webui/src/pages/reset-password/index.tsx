import { Box, Alert, CircularProgress } from "@mui/material";
import {
  Layout,
  PageContainer,
  Card,
  Content
} from "@/common/components/layout/noAuth/Layout";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputContext } from "@/common/hooksForm/InputContext";
import { Button } from "@stories/button/Button";
import { useEffect, useState } from "react";
import { useUser } from "@/common/sdk/hooks/useUser";
import { useNotification } from "@/common/hooks/useNotification";
import { Link } from "@/common/components";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
      ),
    confirmPassword: z.string(),
    code: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const router = useRouter();
  const { code, username } = router.query;
  const { resetPassword } = useUser();
  const { notifySuccessWithStyle, notifyError, NotificationComponent } =
    useNotification();
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const methods = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      code: ""
    }
  });

  useEffect(() => {
    if (!router.isReady) return;

    if (!code || (typeof code === "string" && code.trim() === "")) {
      setCodeError(
        "Verification code is missing. Please use the link from your email."
      );
    } else if (typeof code === "string") {
      setCodeError(null);
      methods.setValue("code", code);
    }
  }, [code, methods, router.isReady]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (codeError) {
      return;
    }

    if (!username) {
      notifyError({
        code: "RESET_PASSWORD_ERROR",
        message:
          "Username is missing. Please try again or request a new reset link."
      });

      return;
    }

    try {
      setIsLoading(true);

      await resetPassword({
        username: String(username),
        password: data.password,
        verificationCode: data.code || ""
      });

      notifySuccessWithStyle("Your password has been successfully reset.", {
        showCountdown: true,
        countdownDuration: 3,
        onClose: () => router.push("/signin")
      });

      setResetSuccess(true);

      methods.reset();
    } catch (error: any) {
      notifyError({
        code: error?.code || "RESET_PASSWORD_ERROR",
        message:
          error?.message ||
          "Failed to reset password. Please try again or request a new reset link."
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
            title="Reset your password"
            description="Please reset your password using 8+ characters with upper, lower,
              number, and symbol."
          >
            {codeError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {codeError}
              </Alert>
            )}
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

            {/* Hidden field for code */}
            <input type="hidden" {...methods.register("code")} />

            <Box sx={{ textAlign: "center", mt: 5 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={methods.handleSubmit(onSubmit)}
                disabled={isLoading || resetSuccess || !!codeError}
                startIcon={
                  isLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : null
                }
              >
                {isLoading ? "RESETTING PASSWORD..." : "RESET PASSWORD"}
              </Button>
            </Box>

            {!resetSuccess ? (
              <Box style={{ textAlign: "center", marginTop: "10px" }}>
                <Link href="/forgot-password" label="Back to forgot password" />
              </Box>
            ) : (
              <Box style={{ textAlign: "center", marginTop: "10px" }}>
                <Link href="/signin" label="Back to sign in" />
              </Box>
            )}
          </Content>
        </Card>
      </PageContainer>
    </Layout>
  );
}
