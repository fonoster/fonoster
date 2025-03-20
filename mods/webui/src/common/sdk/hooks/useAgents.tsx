import { useMemo } from "react";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import {
  CreateAgentRequestExtended,
  UpdateAgentRequest,
  ListAgentsRequest,
  ListAgentsResponse,
  BaseApiObject,
  Agent
} from "@fonoster/types";
import { Agents } from "@fonoster/sdk";

export const useAgents = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

  const _agents = useMemo(() => {
    if (!client) {
      throw new Error("Fonoster client is not initialized.");
    }
    try {
      return new Agents(client as any);
    } catch (error) {
      throw new Error("Failed to initialize Agents client");
    }
  }, [client]);

  const createAgent = async (
    data: CreateAgentRequestExtended
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _agents.createAgent(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const getAgent = async (ref: string): Promise<Agent | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _agents.getAgent(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const updateAgent = async (
    data: UpdateAgentRequest
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _agents.updateAgent(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const listAgents = async (
    data: ListAgentsRequest = {
      pageSize: 10,
      pageToken: undefined
    }
  ): Promise<ListAgentsResponse | undefined> => {
    try {
      if (!isReady) return undefined;

      return await authentication.executeWithRefresh(() =>
        _agents.listAgents(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const deleteAgent = async (
    ref: string
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _agents.deleteAgent(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  return {
    isReady,
    createAgent,
    getAgent,
    updateAgent,
    listAgents,
    deleteAgent
  };
};
