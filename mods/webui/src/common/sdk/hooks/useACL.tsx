import { useMemo } from "react";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import {
  CreateAclRequestExtended,
  UpdateAclRequest,
  ListAclsRequest as BaseListAclsRequest,
  ListAclsResponse as BaseListAclsResponse,
  Acl,
  BaseApiObject
} from "@fonoster/types";
import { Acls } from "@fonoster/sdk";
import { usePaginatedData } from "@/common/hooks/usePaginatedData";

// Extend the ListAclsResponse to include prevPageToken
interface ListAclsResponse extends BaseListAclsResponse, Acl {
  prevPageToken?: string;
  recordTotal?: number;
  filterBy?: Record<string, string>;
}

interface ListAclsRequest extends BaseListAclsRequest {
  filterBy?: Record<string, string>;
  pageSize?: number;
  pageToken?: string;
}

export const useACL = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

  // Handle Fake data - make sure all required Trunk properties are non-optional
  const { listItems } = usePaginatedData<Acl>({
    generateFakeData: (index: number) => ({
      ref: `number-${index}`,
      name: `Number ${index + 1}`, // This is required to be non-optional
      allow: [`City ${index + 1}`],
      deny: [`Country ${index + 1}`],
      // Add any other required fields from Trunk type
      createdAt: new Date(Date.now() - index * 86400000),
      updatedAt: new Date(Date.now() - index * 43200000)
    }),
    totalItems: 30,
    defaultPageSize: 10
  });

  const _acls = useMemo(() => {
    if (!client) {
      throw new Error("Fonoster client is not initialized.");
    }
    try {
      return new Acls(client as any);
    } catch (error) {
      throw new Error("Failed to initialize Acls client");
    }
  }, [client]);

  const createAcl = async (
    data: CreateAclRequestExtended
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _acls.createAcl(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const getAcl = async (ref: string): Promise<Acl | undefined> => {
    try {
      return await authentication.executeWithRefresh(() => _acls.getAcl(ref));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const updateAcl = async (
    data: UpdateAclRequest
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _acls.updateAcl(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const listAcls = async (
    data: ListAclsRequest = {
      pageSize: 10,
      pageToken: undefined
    }
  ): Promise<ListAclsResponse | undefined> => {
    try {
      return (await listItems(data)) as ListAclsResponse;
      // if (!isReady) return undefined;

      // return await authentication.executeWithRefresh(() =>
      //   _acls.listAcls(data)
      // );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const deleteAcl = async (ref: string): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _acls.deleteAcl(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  return {
    isReady,
    createAcl,
    getAcl,
    updateAcl,
    listAcls,
    deleteAcl
  };
};
