import { useMemo } from "react";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import {
  CreateNumberRequestExtended,
  UpdateNumberRequest,
  ListNumbersRequest,
  ListNumbersResponse,
  BaseApiObject,
  INumber
} from "@fonoster/types";
import { Numbers } from "@fonoster/sdk";

export const useNumbers = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

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
      if (!isReady) return undefined;

      return await authentication.executeWithRefresh(() =>
        _numbers.listNumbers(data)
      );
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
