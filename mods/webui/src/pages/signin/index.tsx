import { useState } from "react";
import { Box, Divider, Stack } from "@mui/material";
import {
  Layout,
  PageContainer,
  Card,
  Content
} from "@/common/components/layout/noAuth/Layout";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { Button } from "@stories/button/Button";
import { OAuthState } from "@/types/oauth";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputContext } from "@/common/hooksForm/InputContext";
import { AuthProvider } from "@/common/sdk/auth/AuthClient";
import { OAUTH_CONFIG } from "@/config/oauth";
import { Typography } from "@stories/typography/Typography";
import { Link } from "@/common/components";
import { ErrorType, useNotification } from "@/common/hooks/useNotification";

interface LoginForm {
  email: string;
  password: string;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

export const GITHUB_CONFIG = OAUTH_CONFIG.signin;

const LoginPage = () => {
  const router = useRouter();
  const { authentication } = useFonosterClient();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { notifyError, NotificationComponent } = useNotification();

  const methods = useForm<LoginForm>({
    defaultValues: {
      email: "",
      password: ""
    },
    resolver: zodResolver(loginSchema),
    mode: "onChange"
  });

  const {
    handleSubmit,
    setError,
    formState: { isSubmitting, isValid }
  } = methods;

  const handleGitHubSignIn = () => {
    const stateData: OAuthState = {
      provider: AuthProvider.GITHUB,
      nonce: Math.random().toString(36).substring(2),
      action: "signin"
    };
    const stateEncoded = encodeURIComponent(JSON.stringify(stateData));
    const authUrl = `${GITHUB_CONFIG.authUrl}?client_id=${GITHUB_CONFIG.clientId}&redirect_uri=${encodeURIComponent(GITHUB_CONFIG.redirectUriCallback)}&scope=${GITHUB_CONFIG.scope}&state=${stateEncoded}`;
    window.location.href = authUrl;
  };

  const onSubmit = async (data: LoginForm) => {
    if (isRedirecting) return;
    try {
      setIsRedirecting(true);
      await authentication.signIn({
        credentials: { username: data.email, password: data.password },
        provider: AuthProvider.CREDENTIALS,
        oauthCode: ""
      });
      await router.replace("/workspace/");
    } catch (error) {
      notifyError(error as ErrorType);
      setError("root", {
        type: "manual",
        message:
          error instanceof Error ? error.message : "Authentication failed"
      });
    } finally {
      setIsRedirecting(false);
    }
  };

  return (
    <Layout methods={methods}>
      <PageContainer>
        <Card>
          <Content title="Sign In">
            <InputContext
              name="email"
              label="Email Address"
              type="email"
              shrink
              id="signin-email"
              helperText="Please enter your email address"
            />

            <InputContext
              name="password"
              label="Password"
              type="password"
              shrink
              id="signin-password"
              helperText="Please enter your password"
            />
            <Box sx={{ textAlign: "right", mb: 2 }}>
              <Link href="/forgot-password" label="Forgot password?" />
            </Box>
            <Button
              onClick={handleSubmit(onSubmit)}
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting || isRedirecting || !isValid}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
            <Divider>
              <Typography variant="body-small" color="text.secondary">
                Or
              </Typography>
            </Divider>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleGitHubSignIn}
              disabled={isRedirecting}
            >
              Sign in with GitHub
            </Button>
            <Box sx={{ textAlign: "center" }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="center"
                spacing={0.3}
              >
                <Typography variant="body-small" color="text.secondary">
                  Don't have an account?
                </Typography>
                <Link href="/signup" label="Sign up" />
              </Stack>
            </Box>
          </Content>
        </Card>
        <NotificationComponent />
      </PageContainer>
    </Layout>
  );
};

export default LoginPage;
