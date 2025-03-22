import { useMemo } from "react";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import {
  CreateCredentialsRequest,
  UpdateCredentialsRequest,
  ListCredentialsRequest as BaseListCredentialsRequest,
  ListCredentialsResponse as BaseListCredentialsResponse,
  Credentials as CredentialsType,
  BaseApiObject
} from "@fonoster/types";
import { Credentials } from "@fonoster/sdk";
import { usePaginatedData } from "@/common/hooks/usePaginatedData";

// Extend the ListCredentialsResponse to include prevPageToken
interface ListCredentialsResponse
  extends BaseListCredentialsResponse,
    CredentialsType {
  prevPageToken?: string;
  recordTotal?: number;
  filterBy?: Record<string, string>;
}

interface ListCredentialsRequest extends BaseListCredentialsRequest {
  filterBy?: Record<string, string>;
  pageSize?: number;
  pageToken?: string;
}

export const useCredential = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

  // Handle Fake data - make sure all required Trunk properties are non-optional
  const { listItems } = usePaginatedData<CredentialsType>({
    generateFakeData: (index: number) => ({
      ref: `number-${index}`,
      name: `Number ${index + 1}`, // This is required to be non-optional
      username: `username-${index + 1}`, // This is required to be non-optional
      // Add any other required fields from Trunk type
      createdAt: new Date(Date.now() - index * 86400000),
      updatedAt: new Date(Date.now() - index * 43200000)
    }),
    totalItems: 30,
    defaultPageSize: 10
  });

  const _credentials = useMemo(() => {
    if (!client) {
      throw new Error("Fonoster client is not initialized.");
    }
    try {
      return new Credentials(client as any);
    } catch (error) {
      throw new Error("Failed to initialize Credentials client");
    }
  }, [client]);

  const createCredentials = async (
    data: CreateCredentialsRequest
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _credentials.createCredentials(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const getCredentials = async (
    ref: string
  ): Promise<CredentialsType | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _credentials.getCredentials(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const updateCredentials = async (
    data: UpdateCredentialsRequest
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _credentials.updateCredentials(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const listCredentials = async (
    data: ListCredentialsRequest = {
      pageSize: 10,
      pageToken: undefined
    }
  ): Promise<ListCredentialsResponse | undefined> => {
    try {
      return (await listItems(data)) as ListCredentialsResponse;
      // if (!isReady) return undefined;

      // return await authentication.executeWithRefresh(() =>
      //   _credentials.listCredentials(data)
      // );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const deleteCredentials = async (
    ref: string
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _credentials.deleteCredentials(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  return {
    isReady,
    createCredentials,
    getCredentials,
    updateCredentials,
    listCredentials,
    deleteCredentials
  };
};
