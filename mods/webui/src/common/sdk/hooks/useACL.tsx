import { useMemo } from "react";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import {
  CreateAclRequestExtended,
  UpdateAclRequest,
  ListAclsRequest,
  ListAclsResponse,
  Acl,
  BaseApiObject
} from "@fonoster/types";
import { Acls } from "@fonoster/sdk";

export const useACL = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

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
      if (!isReady) return undefined;

      return await authentication.executeWithRefresh(() =>
        _acls.listAcls(data)
      );
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
