import { useMemo } from "react";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import {
  CreateNumberRequestExtended,
  UpdateNumberRequest,
  ListNumbersRequest as BaseListNumbersRequest,
  ListNumbersResponse as BaseListNumbersResponse,
  BaseApiObject,
  INumber
} from "@fonoster/types";
import { Numbers } from "@fonoster/sdk";
import { usePaginatedData } from "@/common/hooks/usePaginatedData";

// Extend the ListNumbersResponse to include prevPageToken
interface ListNumbersResponse extends BaseListNumbersResponse, INumber {
  prevPageToken?: string;
  recordTotal?: number;
  filterBy?: Record<string, string>;
}

interface ListNumbersRequest extends BaseListNumbersRequest {
  filterBy?: Record<string, string>;
  pageSize?: number;
  pageToken?: string;
}

export const useNumbers = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

  // Handle Fake data - make sure all required Trunk properties are non-optional
  const { listItems } = usePaginatedData<INumber>({
    generateFakeData: (index: number) => ({
      ref: `number-${index}`,
      name: `Number ${index + 1}`, // This is required to be non-optional
      telUrl: `tel:+1234567890`,
      city: `City ${index + 1}`,
      country: `Country ${index + 1}`,
      countryIsoCode: `ISO${index + 1}`,
      agentAor: `sip:agent-${index + 1}@sip.fonoster.com`,
      appRef: `app-${index + 1}`,
      // Add any other required fields from Trunk type
      createdAt: new Date(Date.now() - index * 86400000),
      updatedAt: new Date(Date.now() - index * 43200000)
    }),
    totalItems: 30,
    defaultPageSize: 10
  });

  const _numbers = useMemo(() => {
    if (!client) {
      throw new Error("Fonoster client is not initialized.");
    }
    try {
      return new Numbers(client as any);
    } catch (error) {
      throw new Error("Failed to initialize Numbers client");
    }
  }, [client]);

  const createNumber = async (
    data: CreateNumberRequestExtended
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _numbers.createNumber(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const getNumber = async (ref: string): Promise<INumber | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _numbers.getNumber(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const updateNumber = async (
    data: UpdateNumberRequest
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _numbers.updateNumber(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const listNumbers = async (
    data: ListNumbersRequest = {
      pageSize: 10,
      pageToken: undefined
    }
  ): Promise<ListNumbersResponse | undefined> => {
    try {
      return (await listItems(data)) as ListNumbersResponse;
      // if (!isReady) return undefined;

      // return await authentication.executeWithRefresh(() =>
      //     _numbers.listNumbers(data)
      // );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const deleteNumber = async (
    ref: string
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _numbers.deleteNumber(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  return {
    isReady,
    createNumber,
    getNumber,
    updateNumber,
    listNumbers,
    deleteNumber
  };
};
