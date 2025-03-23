import { useMemo } from "react";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import {
  CreateAgentRequestExtended,
  UpdateAgentRequest,
  ListAgentsRequest as BaseListAgentsRequest,
  ListAgentsResponse as BaseListAgentsResponse,
  BaseApiObject,
  Agent,
  Privacy
} from "@fonoster/types";
import { Agents } from "@fonoster/sdk";
import { usePaginatedData } from "@/common/hooks/usePaginatedData";

// Extend the ListAgentsResponse to include prevPageToken
interface ListAgentsResponse extends BaseListAgentsResponse, Agent {
  prevPageToken?: string;
  recordTotal?: number;
  filterBy?: Record<string, string>;
}

interface ListAgentsRequest extends BaseListAgentsRequest {
  filterBy?: Record<string, string>;
  pageSize?: number;
  pageToken?: string;
}

export const useAgents = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

  // Handle Fake data - make sure all required Trunk properties are non-optional
  const { listItems } = usePaginatedData<Agent>({
    generateFakeData: (index: number) => ({
      ref: `agent-${index}`,
      name: `Agent ${index + 1}`,
      username: `agent${index + 1}`,
      privacy: Privacy.PRIVATE,
      enabled: true,
      domain: {
        ref: `domain-${index + 1}`,
        name: `Domain ${index + 1}`,
        domainUri: `uri-${index + 1}`
      },
      // Add any other required fields from Trunk type
      createdAt: new Date(Date.now() - index * 86400000),
      updatedAt: new Date(Date.now() - index * 43200000)
    }),
    totalItems: 30,
    defaultPageSize: 10
  });

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
      return (await listItems(data)) as ListAgentsResponse;
      // if (!isReady) return undefined;

      // return await authentication.executeWithRefresh(() =>
      //     _agents.listAgents(data)
      // );
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
