import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
import { usePaginatedData } from "@/common/hooks/usePaginatedData";
import {
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  ListWorkspacesResponse,
  BaseApiObject,
  ResendWorkspaceMembershipInvitationResponse,
  RemoveUserFromWorkspaceResponse,
  InviteUserToWorkspaceRequest,
  Workspace,
  ListWorkspaceMembersResponse as BaseListWorkspaceMembersResponse,
  ListWorkspaceMembersRequest as BaseListWorkspaceMembersRequest,
  Role,
  WorkspaceMemberStatus
} from "@fonoster/types";
import { Workspaces } from "@fonoster/sdk";
import { useMemo } from "react";
import { WorkspaceMemberDTO } from "@/types/dto/workspace/WorkspaceMemberDTO";

// Extend the ListWorkspaceMembersResponse to include prevPageToken
interface ListWorkspaceMembersResponse
  extends BaseListWorkspaceMembersResponse {
  prevPageToken?: string;
  recordTotal?: number;
  filterBy?: Record<string, string>;
}

interface ListWorkspaceMembersRequest extends BaseListWorkspaceMembersRequest {
  filterBy?: Record<string, string>;
  pageSize?: number;
}

export const useWorkspaces = () => {
  const { client, isReady, authentication } = useFonosterClient();
  const { notifyError } = useNotification();

  const _workspaces = useMemo(() => {
    if (!client) {
      throw new Error("Fonoster client is not initialized.");
    }

    try {
      return new Workspaces(client as any);
    } catch (error) {
      throw new Error("Failed to initialize Workspaces client");
    }
  }, [client]);

  // Handle Fake data
  const { listItems } = usePaginatedData<WorkspaceMemberDTO>({
    generateFakeData: (index) => ({
      ref: `member-${index}`,
      userRef: `user-${index}`,
      name: `User ${index + 1}`,
      email: `user${index + 1}@example.com`,
      role:
        index % 3 === 0
          ? Role.WORKSPACE_ADMIN
          : index % 3 === 1
            ? Role.WORKSPACE_MEMBER
            : Role.WORKSPACE_OWNER,
      status:
        index % 4 === 0
          ? WorkspaceMemberStatus.PENDING
          : WorkspaceMemberStatus.ACTIVE,
      createdAt: new Date(Date.now() - index * 86400000),
      updatedAt: new Date(Date.now() - index * 43200000)
    }),
    totalItems: 30,
    defaultPageSize: 10
  });

  const listWorkspaces = async (): Promise<
    ListWorkspacesResponse | undefined
  > => {
    if (!isReady) return undefined;

    try {
      return await authentication.executeWithRefresh(() =>
        _workspaces.listWorkspaces()
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
      return undefined;
    }
  };

  const createWorkspace = async (
    data: CreateWorkspaceRequest
  ): Promise<BaseApiObject | undefined> => {
    if (!isReady) return undefined;

    try {
      return await authentication.executeWithRefresh(() =>
        _workspaces.createWorkspace(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const getWorkspace = async (ref: string): Promise<Workspace | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _workspaces.getWorkspace(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const updateWorkspace = async (
    data: UpdateWorkspaceRequest
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _workspaces.updateWorkspace(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const deleteWorkspace = async (
    ref: string
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _workspaces.deleteWorkspace(ref)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const inviteUserToWorkspace = async (
    data: InviteUserToWorkspaceRequest
  ): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _workspaces.inviteUserToWorkspace(data)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const resendWorkspaceMembershipInvitation = async (
    userRef: string
  ): Promise<ResendWorkspaceMembershipInvitationResponse | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _workspaces.resendWorkspaceMembershipInvitation(userRef)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const removeUserFromWorkspace = async (
    userRef: string
  ): Promise<RemoveUserFromWorkspaceResponse | undefined> => {
    try {
      return await authentication.executeWithRefresh(() =>
        _workspaces.removeUserFromWorkspace(userRef)
      );
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const listWorkspaceMembers = async (
    payload: ListWorkspaceMembersRequest = {
      pageSize: 10,
      pageToken: undefined
    }
  ): Promise<ListWorkspaceMembersResponse | undefined> => {
    try {
      return await listItems(payload);
    } catch (error: any) {
      notifyError(error as ErrorType);
      return undefined;
    }
  };

  return {
    isReady,
    listWorkspaces,
    createWorkspace,
    getWorkspace,
    updateWorkspace,
    deleteWorkspace,
    inviteUserToWorkspace,
    resendWorkspaceMembershipInvitation,
    removeUserFromWorkspace,
    listWorkspaceMembers,
    client
  };
};
