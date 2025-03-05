import { useMemo } from "react";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import {
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ListApiKeysRequest,
  ListApiKeysResponse,
  BaseApiObject
} from "@fonoster/types";
import { ApiKeys } from "@fonoster/sdk";

export const useAPIKey = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

  const _apiKeys = useMemo(() => {
    if (!client) {
      throw new Error("Fonoster client is not initialized.");
    }
    try {
      return new ApiKeys(client as any);
    } catch (error) {
      throw new Error("Failed to initialize ApiKeys client");
    }
  }, [client]);

  const createAPIKey = async (
    data: CreateApiKeyRequest
  ): Promise<CreateApiKeyResponse | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _apiKeys.createApiKey(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const regenerateAPIKey = async (
    ref: string
  ): Promise<CreateApiKeyResponse | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _apiKeys.regenerateApiKey(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const listAPIKeys = async (
    data: ListApiKeysRequest = {
      pageSize: 10,
      pageToken: undefined
    }
  ): Promise<ListApiKeysResponse | undefined> => {
    try {
      if (!isReady) return undefined;

      return await authentication.executeWithRefresh(() =>
        _apiKeys.listApiKeys(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const deleteAPIKey = async (
    ref: string
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _apiKeys.deleteApiKey(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  return {
    isReady,
    createAPIKey,
    regenerateAPIKey,
    listAPIKeys,
    deleteAPIKey
  };
};
