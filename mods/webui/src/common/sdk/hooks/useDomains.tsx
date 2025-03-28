import { useMemo } from "react";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import {
  CreateDomainRequest,
  UpdateDomainRequest,
  ListDomainsRequest as BaseListDomainsRequest,
  ListDomainsResponse as BaseListDomainsResponse,
  BaseApiObject,
  Domain
} from "@fonoster/types";
import { Domains } from "@fonoster/sdk";
import { usePaginatedData } from "@/common/hooks/usePaginatedData";

// Extend the ListDomainsResponse to include prevPageToken
interface ListDomainsResponse extends BaseListDomainsResponse, Domain {
  prevPageToken?: string;
  recordTotal?: number;
  filterBy?: Record<string, string>;
}

interface ListDomainsRequest extends BaseListDomainsRequest {
  filterBy?: Record<string, string>;
  pageSize?: number;
  pageToken?: string;
}

export const useDomains = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

  // Handle Fake data - make sure all required Domain properties are non-optional
  const { listItems } = usePaginatedData<Domain>({
    generateFakeData: (index: number) => ({
      ref: `domain-${index}`,
      name: `Domain ${index + 1}`, // This is required to be non-optional
      domainUri: `sip:domain-${index + 1}@sip.fonoster.com`,
      egressRules: `Egress Rule ${index + 1}`,
      createdAt: new Date(Date.now() - index * 86400000),
      updatedAt: new Date(Date.now() - index * 43200000)
    }),
    totalItems: 30,
    defaultPageSize: 10
  });

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
      return (await listItems(data)) as ListDomainsResponse;

      // if (!isReady) return undefined;

      // return await authentication.executeWithRefresh(() =>
      //   _domains.listDomains(data)
      // );
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
