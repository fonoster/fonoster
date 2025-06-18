import { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams, useSubmit } from "react-router";
import type {
  OAuthAction,
  OAuthResponse,
  OAuthState
} from "~/auth/config/oauth";
import {
  useCreateUserWithOauth2Code,
  useLoginWithOauth2Code
} from "~/auth/services/auth.service";
import type { ExchangeCredentialsResponse } from "~/auth/services/sessions/auth.interfaces";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { Splash } from "~/core/components/general/splash/splash";
import { Logger } from "~/core/shared/logger";

// Re-export form action
export { action } from "./github-oauth.action";

export default function GithubOAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const submit = useSubmit();
  const { mutateAsync: createUser } = useCreateUserWithOauth2Code();
  const { mutateAsync: loginUser } = useLoginWithOauth2Code();

  const getOAuthResponse = useCallback((): OAuthResponse | null => {
    if (!code || !state) return null;

    try {
      const decoded = JSON.parse(decodeURIComponent(state)) as OAuthState;
      return { code, action: decoded.action };
    } catch (error) {
      Logger.error(
        "[GithubOAuth] Failed to parse state, defaulting to signin",
        error
      );
      return { code, action: "signin" };
    }
  }, [code, state]);

  const handleOAuthResponse = useCallback(async () => {
    const oauth = getOAuthResponse();
    if (!oauth) throw new Error("Missing code or state");

    const { code, action } = oauth;
    const actionMap: Record<OAuthAction, () => Promise<any>> = {
      signin: () => loginUser(code),
      signup: () => createUser(code)
    };

    const response: ExchangeCredentialsResponse = await actionMap[action]();

    toast("Authentication successful! Redirecting...");
    Logger.debug(`[GithubOAuth] User ${action} successful, redirecting`);

    await submit({ ...response }, { method: "post", viewTransition: true });
  }, [getOAuthResponse, loginUser, createUser, submit]);

  useEffect(() => {
    if (!code || !state) {
      toast("Invalid OAuth response");
      navigate("/auth/login");
      return;
    }

    handleOAuthResponse()
      .then(() => navigate("/"))
      .catch((error) => {
        Logger.error("[GithubOAuth] Error handling OAuth response", error);
        toast("Authentication failed. Please try again.");
        navigate("/auth/login");
      });
  }, [code, state, handleOAuthResponse, navigate]);

  return <Splash message="Authenticating with OAuth providers..." />;
}
