import { useMemo } from "react";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import {
  CreateSecretRequest,
  UpdateSecretRequest,
  ListSecretsRequest as BaseListSecretsRequest,
  ListSecretsResponse as BaseListSecretsResponse,
  Secret,
  BaseApiObject
} from "@fonoster/types";
import { usePaginatedData } from "@/common/hooks/usePaginatedData";
import { Secrets } from "@fonoster/sdk";

// Extend the ListSecretsResponse to include prevPageToken
interface ListSecretsResponse extends BaseListSecretsResponse, Secret {
  prevPageToken?: string;
  recordTotal?: number;
  filterBy?: Record<string, string>;
}

interface ListSecretsRequest extends BaseListSecretsRequest {
  filterBy?: Record<string, string>;
  pageSize?: number;
  pageToken?: string;
}
export const useSecret = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

  // Handle Fake data - make sure all required Secret properties are non-optional
  const { listItems } = usePaginatedData<Secret>({
    generateFakeData: (index: number) => ({
      ref: `secret-${index}`,
      name: `Secret ${index + 1}`, // This is required to be non-optional
      secret: `Secret ${index + 1}`, // This is required to be non-optional
      createdAt: new Date(Date.now() - index * 86400000).getTime(),
      updatedAt: new Date(Date.now() - index * 43200000).getTime()
    }),
    totalItems: 30,
    defaultPageSize: 10
  });

  const _secrets = useMemo(() => {
    if (!client) {
      throw new Error("Fonoster client is not initialized.");
    }
    try {
      return new Secrets(client as any);
    } catch (error) {
      throw new Error("Failed to initialize Secrets client");
    }
  }, [client]);

  const createSecret = async (
    data: CreateSecretRequest
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _secrets.createSecret(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const getSecret = async (ref: string): Promise<Secret | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _secrets.getSecret(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const updateSecret = async (
    data: UpdateSecretRequest
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _secrets.updateSecret(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const listSecrets = async (
    data: ListSecretsRequest = {
      pageSize: 10,
      pageToken: undefined
    }
  ): Promise<ListSecretsResponse | undefined> => {
    try {
      return (await listItems(data)) as ListSecretsResponse;

      // if (!isReady) return undefined;

      // return await authentication.executeWithRefresh(() =>
      //   _secrets.listSecrets(data)
      // );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const deleteSecret = async (
    ref: string
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _secrets.deleteSecret(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  return {
    isReady,
    createSecret,
    getSecret,
    updateSecret,
    listSecrets,
    deleteSecret
  };
};
