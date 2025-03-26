import { useState, useEffect } from "react";
import { Box, Divider, Stack } from "@mui/material";
import {
  Layout,
  PageContainer,
  Card,
  Content
} from "@/common/components/layout/noAuth/Layout";
import { useRouter } from "next/router";
import { ModalTerms } from "@stories/modalterms/ModalTerms";
import { useForm } from "react-hook-form";
import { InputContext } from "@/common/hooksForm/InputContext";
import { CheckboxContext } from "@/common/hooksForm/CheckboxContext";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@stories/button/Button";
import { useUser } from "@/common/sdk/hooks/useUser";
import { OAuthState } from "@/types/oauth";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { AuthProvider } from "@/common/sdk/auth/AuthClient";
import { OAUTH_CONFIG } from "@/config/oauth";
import { Typography } from "@stories/typography/Typography";
import { Link } from "@/common/components";
import { useNotification } from "@/common/hooks/useNotification";

const signUpSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
      ),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions"
    })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export const GITHUB_CONFIG = OAUTH_CONFIG.signup;

const SignUpPage = () => {
  const router = useRouter();
  const { notifyError, NotificationComponent } = useNotification();
  const [openTerms, setOpenTerms] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { createUser, isReady } = useUser();
  const { authentication } = useFonosterClient();

  const methods = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false
    },
    mode: "onChange"
  });
  const {
    watch,
    handleSubmit,
    formState: { errors }
  } = methods;

  const handleCloseTerms = () => {
    setOpenTerms(false);
  };

  const onSubmit = async (data: SignUpFormData) => {
    if (!isReady) return;

    try {
      setIsRedirecting(true);

      const result = await createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        avatar: ""
      });

      if (!result) {
        throw new Error("Failed to create user: No result returned");
      }

      try {
        await authentication.signIn({
          provider: AuthProvider.CREDENTIALS,
          credentials: {
            username: data.email,
            password: data.password
          },
          oauthCode: ""
        });
        router.push("/signup/verify");
      } catch (loginError) {
        router.push("/signup/verify");
      }

      setIsRedirecting(false);
    } catch (error: any) {
      let errorMessage = "An error occurred during registration";

      if (error?.message) {
        if (error.message.includes("already exists") || error.code === 6) {
          errorMessage =
            "An account with this email already exists. Please try signing in.";
        } else if (error.message.includes("timeout")) {
          errorMessage =
            "The server took too long to respond. Please try again later.";
        } else if (error.message.includes("network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      notifyError({
        code: "error",
        message: errorMessage
      });
      setIsRedirecting(false);
    }
  };

  const handleGitHubSignUp = () => {
    const stateData: OAuthState = {
      provider: AuthProvider.GITHUB,
      nonce: Math.random().toString(36).substring(2),
      action: "signup"
    };
    const stateEncoded = encodeURIComponent(JSON.stringify(stateData));
    const authUrl = `${GITHUB_CONFIG.authUrl}?client_id=${GITHUB_CONFIG.clientId}&redirect_uri=${encodeURIComponent(GITHUB_CONFIG.redirectUriCallback)}&scope=${GITHUB_CONFIG.scope}&state=${stateEncoded}`;
    window.location.href = authUrl;
  };

  const watchAgreeToTerms = watch("agreeToTerms");

  useEffect(() => {
    if (watchAgreeToTerms) {
      setOpenTerms(true);
    }
  }, [watchAgreeToTerms]);

  return (
    <Layout methods={methods}>
      <NotificationComponent />
      <PageContainer>
        <Card>
          <Content title="Sign up for Fonoster">
            <InputContext
              name="name"
              label="Name"
              id="name"
              helperText="Please enter your name"
            />

            <InputContext
              name="email"
              label="Email Address"
              type="email"
              id="email"
              helperText="Please enter your email address"
            />

            <InputContext
              name="password"
              label="Password"
              type="password"
              id="password"
              helperText={
                errors.password?.message ||
                "8+ characters with upper, lower, number, and symbol"
              }
            />

            <InputContext
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              helperText={
                errors.confirmPassword?.message ||
                "Please confirm your password"
              }
            />

            <Box style={{ marginBottom: "25px", textAlign: "center" }}>
              <CheckboxContext
                id="agreeToTerms"
                name="agreeToTerms"
                label={"Agree to the terms and conditions"}
              />
            </Box>

            <Stack direction="column" spacing={1.5}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSubmit(onSubmit)}
                disabled={isRedirecting}
              >
                {isRedirecting ? "SIGNING UP..." : "SIGN UP FOR FONOSTER"}
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
                onClick={handleGitHubSignUp}
                disabled={isRedirecting}
              >
                Sign up with GitHub
              </Button>
            </Stack>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={0.3}
            >
              <Typography
                variant="body-small"
                color="text.secondary"
                display="inline"
              >
                Already have an account?
              </Typography>
              <Link href="/signin" label="Sign In" />
            </Stack>
          </Content>
        </Card>
      </PageContainer>

      <ModalTerms
        open={openTerms}
        onClose={handleCloseTerms}
        title="Terms and Conditions"
      />
    </Layout>
  );
};

export default SignUpPage;
