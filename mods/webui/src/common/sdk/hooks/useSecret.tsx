import { useMemo } from "react";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import {
  CreateSecretRequest,
  UpdateSecretRequest,
  ListSecretsRequest,
  ListSecretsResponse,
  Secret,
  BaseApiObject
} from "@fonoster/types";
import { Secrets } from "@fonoster/sdk";

export const useSecret = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

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
      if (!isReady) return undefined;

      return await authentication.executeWithRefresh(() =>
        _secrets.listSecrets(data)
      );
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
