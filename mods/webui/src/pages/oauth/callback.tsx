import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { OAuthResponse, OAuthAction, OAuthState } from "@/types/oauth";
import { GITHUB_CONFIG as SIGNIN_CONFIG } from "@/pages/signin";
import { GITHUB_CONFIG as SIGNUP_CONFIG } from "@/pages/signup";
import { useUser } from "@/common/sdk/hooks/useUser";
import { AuthProvider } from "@/common/sdk/auth/AuthClient";
import { Box, CircularProgress, Typography, useTheme } from "@mui/material";
import { GitHub as GitHubIcon } from "@mui/icons-material";

const ProviderIcon = ({ provider }: { provider: AuthProvider }) => {
  switch (provider) {
    case AuthProvider.GITHUB:
      return <GitHubIcon sx={{ fontSize: 48, mb: 2 }} />;
    default:
      return null;
  }
};

const LoadingMessage = ({
  provider,
  step
}: {
  provider: AuthProvider;
  step: number;
}) => {
  const messages: Record<AuthProvider, string[]> = {
    [AuthProvider.GITHUB]: [
      "Connecting to GitHub...",
      "Verifying credentials...",
      "Almost there..."
    ],
    [AuthProvider.GOOGLE]: [
      "Connecting to Google...",
      "Verifying credentials...",
      "Almost there..."
    ],
    [AuthProvider.CREDENTIALS]: [
      "Connecting...",
      "Verifying...",
      "Almost there..."
    ],
    [AuthProvider.OTHER]: ["Connecting...", "Verifying...", "Almost there..."]
  };

  return (
    <Typography variant="body1" color="text.secondary">
      {messages[provider][step]}
    </Typography>
  );
};

const OAuthCallback = () => {
  const router = useRouter();
  const { authentication } = useFonosterClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const { createUserWithOauth2Code } = useUser();
  const theme = useTheme();
  const [loadingStep, setLoadingStep] = useState(0);
  const [provider, setProvider] = useState<AuthProvider>(AuthProvider.OTHER);

  useEffect(() => {
    let stepInterval: NodeJS.Timeout;
    if (isProcessing) {
      stepInterval = setInterval(() => {
        setLoadingStep((prev) => (prev < 2 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(stepInterval);
  }, [isProcessing]);

  useEffect(() => {
    if (!router.isReady) return;
    const { code, state } = router.query;
    if (!code || !state) return;

    let provider: AuthProvider;
    let action: OAuthAction;
    try {
      const decoded = JSON.parse(
        decodeURIComponent(state as string)
      ) as OAuthState;
      provider = decoded.provider;
      action = decoded.action;
      setProvider(provider);
    } catch (error) {
      provider = AuthProvider.OTHER;
      action = "signin";
    }

    const oauthResponse: OAuthResponse = {
      code: code as string,
      provider: provider,
      action: action
    };

    handleCallback(oauthResponse);
  }, [router.isReady, router.query]);

  const handleCallback = async (oauthResponse: OAuthResponse) => {
    const { code, provider, action } = oauthResponse;
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      if (action === "signin") {
        await authentication.signIn({
          credentials: { username: "", password: "" },
          provider: provider as AuthProvider,
          oauthCode: code
        });
        await router.replace(SIGNIN_CONFIG.redirectUri);
      }

      if (action === "signup") {
        const response = await createUserWithOauth2Code(code);
        await router.replace(SIGNUP_CONFIG.redirectUri);
      }
    } catch (error) {
      await router.push(action === "signin" ? "/signin" : "/signup");
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: theme.palette.background.default
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: 4,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper
        }}
      >
        <ProviderIcon provider={provider} />
        <CircularProgress size={40} thickness={4} sx={{ mb: 2 }} />
        <LoadingMessage provider={provider} step={loadingStep} />
      </Box>
    </Box>
  );
};

export default OAuthCallback;
