import { useMemo } from "react";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import {
  Trunk,
  BaseApiObject,
  CreateTrunkRequest,
  UpdateTrunkRequest,
  ListTrunksRequest,
  ListTrunksResponse,
} from "@fonoster/types";
import { Trunks } from "@fonoster/sdk";

export const useTrunks = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

  const _trunks = useMemo(() => {
    if (!client) {
      throw new Error("Fonoster client is not initialized.");
    }
    try {
      return new Trunks(client as any);
    } catch (error) {
      throw new Error("Failed to initialize Trunks client");
    }
  }, [client]);

  const createTrunk = async (
    data: CreateTrunkRequest
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _trunks.createTrunk(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const getTrunk = async (
    ref: string
  ): Promise<Trunk | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _trunks.getTrunk(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const updateTrunk = async (
    data: UpdateTrunkRequest
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _trunks.updateTrunk(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const listTrunks = async (
    data: ListTrunksRequest = {
      pageSize: 10,
      pageToken: undefined
    }
  ): Promise<ListTrunksResponse | undefined> => {
    try {
      if (!isReady) return undefined;

      return await authentication.executeWithRefresh(() =>
        _trunks.listTrunks(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const deleteTrunk = async (
    ref: string
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _trunks.deleteTrunk(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  return {
    isReady,
    createTrunk,
    getTrunk,
    updateTrunk,
    listTrunks,
    deleteTrunk
  };
};
