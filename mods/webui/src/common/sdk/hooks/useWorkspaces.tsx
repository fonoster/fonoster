import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { useNotification, ErrorType } from "@/common/hooks/useNotification";
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

// Extend the ListWorkspaceMembersResponse to include prevPageToken
interface ListWorkspaceMembersResponse extends BaseListWorkspaceMembersResponse {
  prevPageToken?: string;
  recordTotal?: number;
  filterBy?: Record<string, string>;
}

// Extend the base request to include dynamic filter properties
interface ColumnFilter {
  id: string;
  value: string;
}

interface ListWorkspaceMembersRequest extends BaseListWorkspaceMembersRequest {
  columnFilters?: ColumnFilter[];
  globalFilter?: string;
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
    console.log("listWorkspaceMembers payload:", payload);
    try {
      // Create a collection of 30 fake members
      const allFakeMembers = Array.from({ length: 30 }).map((_, index) => ({
        ref: `member-${index}`,
        userRef: `user-${index}`,
        name: `User ${index + 1}`,
        email: `user${index + 1}@example.com`,
        role: index % 3 === 0 ? Role.WORKSPACE_ADMIN : index % 3 === 1 ? Role.WORKSPACE_MEMBER : Role.WORKSPACE_OWNER,
        status: index % 4 === 0 ? WorkspaceMemberStatus.PENDING : WorkspaceMemberStatus.ACTIVE,
        createdAt: new Date(Date.now() - (index * 86400000)),
        updatedAt: new Date(Date.now() - (index * 43200000))
      }));

      // Apply filters if they exist
      let filteredMembers = [...allFakeMembers];

      // Apply filterBy if it exists
      if (payload.filterBy) {
        Object.entries(payload.filterBy).forEach(([key, value]) => {
          if (value) {
            filteredMembers = filteredMembers.filter(member => {
              const memberValue = member[key as keyof typeof member];
              if (typeof memberValue === 'string') {
                return memberValue.toLowerCase().includes(value.toLowerCase());
              }
              return false;
            });
          }
        });
      }

      // Get pagination parameters
      const pageSize = payload.pageSize || 10;
      const pageToken = payload.pageToken;

      // Calculate total records after filtering
      const recordTotal = filteredMembers.length;

      // Determine the starting index based on the cursor token
      let startIndex = 0;
      if (pageToken) {
        const tokenParts = pageToken.split("-");
        if (tokenParts.length === 2) {
          startIndex = parseInt(tokenParts[1], 10);
        }
      }

      // Get the current page of members
      const endIndex = Math.min(startIndex + pageSize, filteredMembers.length);
      const pageMembers = filteredMembers.slice(startIndex, endIndex);

      // Determine if there are more pages
      const hasNextPage = endIndex < filteredMembers.length;
      const hasPrevPage = startIndex > 0;

      // Create the next page token if there are more pages
      const nextPageToken = hasNextPage ? `cursor-${endIndex}` : undefined;

      // Create the previous page token if we're not on the first page
      const prevPageToken = hasPrevPage ? `cursor-${Math.max(0, startIndex - pageSize)}` : undefined;
      console.log("pageMembers", pageMembers);
      return {
        items: pageMembers,
        nextPageToken: nextPageToken,
        prevPageToken: prevPageToken,
        recordTotal: recordTotal
      };
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
