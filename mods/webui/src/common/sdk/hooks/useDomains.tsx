import { useMemo } from "react";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import {
  CreateDomainRequest,
  UpdateDomainRequest,
  ListDomainsRequest,
  ListDomainsResponse,
  BaseApiObject,
  Domain
} from "@fonoster/types";
import { Domains } from "@fonoster/sdk";

export const useDomains = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

  const _domains = useMemo(() => {
    if (!client) {
      throw new Error("Fonoster client is not initialized.");
    }
    try {
      return new Domains(client as any);
    } catch (error) {
      throw new Error("Failed to initialize Domains client");
    }
  }, [client]);

  const createDomain = async (
    data: CreateDomainRequest
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _domains.createDomain(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const getDomain = async (ref: string): Promise<Domain | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _domains.getDomain(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const updateDomain = async (
    data: UpdateDomainRequest
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _domains.updateDomain(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const listDomains = async (
    data: ListDomainsRequest = {
      pageSize: 10,
      pageToken: undefined
    }
  ): Promise<ListDomainsResponse | undefined> => {
    try {
      if (!isReady) return undefined;

      return await authentication.executeWithRefresh(() =>
        _domains.listDomains(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const deleteDomain = async (
    ref: string
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _domains.deleteDomain(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  return {
    isReady,
    createDomain,
    getDomain,
    updateDomain,
    listDomains,
    deleteDomain
  };
};
