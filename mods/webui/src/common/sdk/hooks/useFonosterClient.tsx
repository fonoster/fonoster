import { useContext } from 'react';
import * as SDK from '@fonoster/sdk';
import { FonosterContext, SignInOptions } from '@/common/sdk/provider/FonosterContext';
import { ErrorType, useNotification } from '@/common/hooks/useNotification';
import { tokenUtils } from '@/common/utils/tokenUtils';

interface FonosterClient {
  client: SDK.Client | null;
  isReady: boolean;
  authentication: {
    signIn: (options: SignInOptions) => Promise<void>;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
  };
  SDK: typeof SDK;
  verifyCode: (params: VerifyCode) => Promise<VerifyCode | undefined>;
  sendVerificationCode: (params: SendVerificationCode) => Promise<SendVerificationCode | undefined>;
  executeWithRefresh: <T>(operation: () => Promise<T>) => Promise<T>;
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

export function useFonosterClient(): FonosterClient {
  const context = useContext(FonosterContext);
  const { notifyError } = useNotification();

  if (!context) {
    throw new Error('useFonosterClient must be used within a Fonoster Context.Provider');
  }

  const executeWithRefresh = async <T,>(operation: () => Promise<T>): Promise<T> => {
    try {
        try {
          await context.authentication.refreshSession();
        } catch (refreshError) {
          notifyError(refreshError as ErrorType);
          throw refreshError;
        }
      return await operation();
    } catch (error: any) {
      if (error?.message?.includes('token expired') || error?.message?.includes('invalid token')) {
        try {
          await context.authentication.refreshSession();
          return await operation();
        } catch (refreshError) {
          notifyError(refreshError as ErrorType);
          throw refreshError;
        }
      }
      throw error;
    }
  };

  const verifyCode = async (params: VerifyCode): Promise<VerifyCode | undefined> => {
    try {
      return await executeWithRefresh(() => context.client!.verifyCode(params));
    } catch (error: any) {
      notifyError(error as ErrorType);
      return undefined;
    }
  };

  const sendVerificationCode = async (params: SendVerificationCode): Promise<SendVerificationCode | undefined> => {
    try {
      return await executeWithRefresh(() => context.client!.sendVerificationCode(params));
    } catch (error: any) {
      notifyError(error as ErrorType);
      return undefined;
    }
  };

  return {
    client: context.client,
    isReady: context.isInitialized && context.client !== null,
    authentication: context.authentication,
    SDK,
    verifyCode,
    sendVerificationCode,
    executeWithRefresh
  };
}
