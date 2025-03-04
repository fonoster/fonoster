import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import {
  BaseApiObject,
  CreateUserRequest,
  UpdateUserRequest,
  User,
  ResetPasswordRequest
} from "@fonoster/types";
import { Users } from "@fonoster/sdk";
import { jwtDecode } from "jwt-decode";
import { useMemo } from "react";
import { AUTH_COOKIES, cookieUtils } from "@/common/utils/cookieUtils";

interface IDToken {
  iss: string;
  sub: string;
  aud: string;
  tokenUse: string;
  accessKeyId: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneNumberVerified: boolean;
  iat: number;
  exp: number;
}

interface ExchangeCredentialsResponse {
  tokens: {
    idToken: string;
    accessToken: string;
    refreshToken: string;
  };
}

export const useUser = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

  const _users = useMemo(() => {
    if (!client) {
      throw new Error("Fonoster client is not initialized.");
    }

    try {
      return new Users(client as any);
    } catch (error) {
      throw new Error("Failed to initialize Users client");
    }
  }, [client]);

  const createUser = async (
    data: CreateUserRequest
  ): Promise<BaseApiObject | undefined> => {
    if (!isReady) return undefined;

    try {
      return await _users.createUser(data);
    } catch (error: any) {
      notifyError(error as ErrorType);
      throw error;
    }
  };

  const createUserWithOauth2Code = async (
    code: string
  ): Promise<ExchangeCredentialsResponse> => {
    if (!isReady) {
      throw new Error("Fonoster client is not initialized.");
    }

    try {
      const response = await _users.createUserWithOauth2Code({ code });
      if (response && response.tokens) {
        try {
          await authentication.handleOAuth2Signup(response.tokens);
        } catch (tokenError) {
          throw tokenError;
        }
      }

      return response;
    } catch (error: any) {
      notifyError(error as ErrorType);
      throw error;
    }
  };

  const getUser = async (ref: string): Promise<User | undefined> => {
    try {
      return await authentication.executeWithRefresh(() => _users.getUser(ref));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const updateUser = async (
    data: UpdateUserRequest
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _users.updateUser(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const deleteUser = async (
    ref: string
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _users.deleteUser(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const loggedUser = async (): Promise<User | undefined> => {
    try {
      const idToken = cookieUtils.getCookie(AUTH_COOKIES.ID_TOKEN.name);
      if (!idToken) {
        return undefined;
      }
      const user = jwtDecode<IDToken>(idToken);
      return await getUser(user.sub);
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const idToken = async (): Promise<IDToken | undefined> => {
    try {
      const idToken = cookieUtils.getCookie(AUTH_COOKIES.ID_TOKEN.name);
      if (!idToken) {
        return undefined;
      }
      const user = jwtDecode<IDToken>(idToken);
      return user;
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const sendResetPasswordCode = async (
    data: string
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _users.sendResetPasswordCode(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const resetPassword = async (
    data: ResetPasswordRequest
  ): Promise<void | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _users.resetPassword(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  return {
    isReady,
    createUser,
    getUser,
    updateUser,
    deleteUser,
    loggedUser,
    idToken,
    sendResetPasswordCode,
    resetPassword,
    createUserWithOauth2Code
  };
};
