import { useMemo } from "react";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import {
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ListApiKeysRequest as BaseListApiKeysRequest,
  ListApiKeysResponse as BaseListApiKeysResponse,
  BaseApiObject
} from "@fonoster/types";
import { ApiKeys } from "@fonoster/sdk";
import { usePaginatedData } from "@/common/hooks/usePaginatedData";

// Extend the ListApiKeysResponse to include prevPageToken
interface ListApiKeysResponse extends BaseListApiKeysResponse {
  prevPageToken?: string;
  recordTotal?: number;
  filterBy?: Record<string, string>;
}

interface ListApiKeysRequest extends BaseListApiKeysRequest {
  filterBy?: Record<string, string>;
  pageSize?: number;
  pageToken?: string;
}

export const useAPIKey = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

  // Handle Fake data
  const { listItems } = usePaginatedData<any>({
    generateFakeData: (index: number) => ({
      ref: `api-${index}`,
      name: `API Key ${index + 1}`
    }),
    totalItems: 30,
    defaultPageSize: 10
  });

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
      return (await listItems(data)) as ListApiKeysResponse;

      // if (!isReady) return undefined;

      // return await authentication.executeWithRefresh(() =>
      //   _apiKeys.listApiKeys(data)
      // );
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
