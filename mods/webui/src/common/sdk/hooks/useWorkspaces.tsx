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
  ListWorkspaceMembersRequest,
  Role,
  WorkspaceMemberStatus
} from "@fonoster/types";
import { Workspaces } from "@fonoster/sdk";
import { useMemo } from "react";

// Extend the ListWorkspaceMembersResponse to include prevPageToken
interface ListWorkspaceMembersResponse extends BaseListWorkspaceMembersResponse {
  prevPageToken?: string;
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
    // Generate fake data instead of making an API call

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
        createdAt: new Date(Date.now() - (index * 86400000)), // Different dates as Date objects
        updatedAt: new Date(Date.now() - (index * 43200000))  // Different dates as Date objects
      }));

      // Get pagination parameters
      const pageSize = payload.pageSize || 10;
      const pageToken = payload.pageToken;

      // Determine the starting index based on the cursor token
      let startIndex = 0;
      if (pageToken) {
        // Extract the index from the token (format: "cursor-{index}")
        const tokenParts = pageToken.split("-");
        if (tokenParts.length === 2) {
          startIndex = parseInt(tokenParts[1], 10);
        }
      }

      console.log("Token received:", pageToken, "Starting index:", startIndex);

      // Get the current page of members
      const endIndex = Math.min(startIndex + pageSize, allFakeMembers.length);
      const pageMembers = allFakeMembers.slice(startIndex, endIndex);

      // Determine if there are more pages
      const hasNextPage = endIndex < allFakeMembers.length;
      const hasPrevPage = startIndex > 0;

      // Create the next page token if there are more pages
      const nextPageToken = hasNextPage ? `cursor-${endIndex}` : undefined;

      // Create the previous page token if we're not on the first page
      // This is crucial for backward pagination
      const prevPageToken = hasPrevPage ? `cursor-${Math.max(0, startIndex - pageSize)}` : undefined;

      // For debugging
      console.log("Pagination info:", {
        startIndex,
        endIndex,
        totalMembers: allFakeMembers.length,
        returnedMembers: pageMembers.length,
        hasNextPage,
        nextPageToken,
        hasPrevPage,
        prevPageToken,
        pageMembers: pageMembers.map(m => m.name) // Just log names for brevity
      });

      // Return the paginated response with both nextPageToken and prevPageToken
      return {
        items: pageMembers,
        nextPageToken: nextPageToken,
        // Include prevPageToken in the response to support backward pagination
        prevPageToken: prevPageToken
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
