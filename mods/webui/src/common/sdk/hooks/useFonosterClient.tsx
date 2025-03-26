import { useContext, useEffect, useCallback, useState } from "react";
import { WebClient } from "@/common/sdk/config/sdkConfig";
import { FonosterContext } from "@/common/sdk/provider/FonosterContext";
import { ErrorType, useNotification } from "@/common/hooks/useNotification";
import { SignInOptions } from "../auth/AuthClient";

// Type definitions
interface FonosterClient {
  client: WebClient | null;
  isReady: boolean;
  isAuthenticated: boolean;
  authentication: {
    signIn: (options: SignInOptions) => Promise<void>;
    signOut: () => Promise<void>;
    executeWithRefresh: <T>(operation: () => Promise<T>) => Promise<T>;
    handleOAuth2Signup: (tokens: {
      idToken: string;
      accessToken: string;
      refreshToken: string;
    }) => Promise<void>;
  };
  verifyCode: (params: VerifyCode) => Promise<any>;
  sendVerificationCode: (params: SendVerificationCode) => Promise<any>;
  setAccessKeyId: (accessKeyId: string) => Promise<void>;
}

enum CodeType {
  EMAIL = "EMAIL",
  PHONE = "PHONE"
}

interface VerifyCode {
  username: string;
  contactType: CodeType;
  value: string;
  verificationCode: string;
}

interface SendVerificationCode {
  type: CodeType;
  value: string;
}

/**
 * Hook to access the Fonoster client and its functionalities
 * @returns Object with client and authentication methods
 */
export function useFonosterClient(): FonosterClient {
  const { client, isInitialized, session, authClient } =
    useContext(FonosterContext);
  const { notifyError } = useNotification();
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      if (!authClient || !isInitialized || hasCheckedSession) return;

      setHasCheckedSession(true);

      try {
        await authClient.refreshSession();
      } catch (error) {}
    };

    checkSession();
  }, [authClient, isInitialized, hasCheckedSession]);

  /**
   * Verifies an authentication code
   */
  const verifyCode = useCallback(
    async (params: VerifyCode): Promise<any> => {
      try {
        if (!authClient || !client) {
          return undefined;
        }
        return await authClient.executeWithRefresh(() =>
          client.verifyCode(params as any)
        );
      } catch (error: any) {
        notifyError(error as ErrorType);
        return undefined;
      }
    },
    [authClient, client]
  );

  /**
   * Sends a verification code
   */
  const sendVerificationCode = useCallback(
    async (params: SendVerificationCode): Promise<any> => {
      try {
        if (!authClient || !client) {
          return undefined;
        }
        return await authClient.executeWithRefresh(() =>
          client.sendVerificationCode(params as any)
        );
      } catch (error: any) {
        notifyError(error as ErrorType);
        return undefined;
      }
    },
    [authClient, client]
  );

  /**
   * Sets the access key ID
   */
  const setAccessKeyId = useCallback(
    async (accessKeyId: string) => {
      if (client && accessKeyId) {
        try {
          client.setAccessKeyId(accessKeyId, undefined);
        } catch (error) {}
      } else {
      }
    },
    [authClient, client]
  );

  /**
   * Authentication methods
   */
  const authentication = {
    signIn: (options: SignInOptions) => {
      if (!authClient) throw new Error("AuthClient is not initialized");
      return authClient.signIn(options);
    },
    signOut: () => {
      if (!authClient) throw new Error("AuthClient is not initialized");
      return authClient.signOut();
    },
    executeWithRefresh: <T,>(operation: () => Promise<T>) => {
      if (!authClient) throw new Error("AuthClient is not initialized");
      return authClient.executeWithRefresh(operation);
    },
    handleOAuth2Signup: (tokens: {
      idToken: string;
      accessToken: string;
      refreshToken: string;
    }) => {
      if (!authClient) throw new Error("AuthClient is not initialized");
      return authClient.handleOAuth2Signup(tokens);
    }
  };

  return {
    client,
    isReady: isInitialized && client !== null,
    isAuthenticated: session.isAuthenticated,
    authentication,
    verifyCode,
    sendVerificationCode,
    setAccessKeyId
  };
}
