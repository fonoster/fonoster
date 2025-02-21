import { useFonosterClient } from '@/common/sdk/hooks/useFonosterClient'
import { useNotification, ErrorType } from '@/common/hooks/useNotification'
import {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  BaseApiObject
} from '@fonoster/types'
import { jwtDecode } from 'jwt-decode';

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


export const useUser = () => {
  const { client, isReady, SDK, executeWithRefresh } = useFonosterClient();
  const { notifyError } = useNotification();
  const users = new SDK.Users(client);


  const createUser = async (data: CreateUserRequest): Promise<BaseApiObject | undefined> => {
    if (!isReady) return undefined;

    try {
      return await executeWithRefresh(() => users.createUser(data));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };


  const getUser = async (ref: string): Promise<User | undefined> => {
    try {
      return await executeWithRefresh(() => users.getUser(ref));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const updateUser = async (data: UpdateUserRequest): Promise<BaseApiObject | undefined> => {
    try {
      return await executeWithRefresh(() => users.updateUser(data));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const deleteUser = async (ref: string): Promise<BaseApiObject | undefined> => {
    try {
      return await executeWithRefresh(() => users.deleteUser(ref));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const loggedUser = async (): Promise<User | undefined> => {
    try {
      const idToken = client.getIdToken();
      const user = jwtDecode<IDToken>(idToken);
      return await getUser(user.sub);
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const idToken = async (): Promise<User | undefined> => {
    try {
      const idToken = client.getIdToken();
      const user = jwtDecode<IDToken>(idToken);
      return await getUser(user.sub);
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
    idToken
  };
}; 