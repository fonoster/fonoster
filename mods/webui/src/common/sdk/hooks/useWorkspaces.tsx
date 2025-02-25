import { useFonosterClient } from '@/common/sdk/hooks/useFonosterClient'
import { useNotification, ErrorType } from '@/common/hooks/useNotification'
import {
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  ListWorkspacesResponse,
  BaseApiObject,
  ResendWorkspaceMembershipInvitationResponse,
  RemoveUserFromWorkspaceResponse,
  InviteUserToWorkspaceRequest,
  Workspace,
  ListWorkspaceMembersResponse,
  ListWorkspaceMembersRequest
} from '@fonoster/types'
import { Workspaces } from '@fonoster/sdk';
import { useMemo } from 'react';

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

  const listWorkspaces = async (): Promise<ListWorkspacesResponse | undefined> => {
    if (!isReady) return undefined;

    try {
      return await authentication.executeWithRefresh(() => _workspaces.listWorkspaces());
    } catch (error: any) {
      notifyError(error as ErrorType);
      return undefined;
    }
  };

  const createWorkspace = async (data: CreateWorkspaceRequest): Promise<BaseApiObject | undefined> => {
    if (!isReady) return undefined;

    try {
      return await authentication.executeWithRefresh(() => _workspaces.createWorkspace(data));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const getWorkspace = async (ref: string): Promise<Workspace | undefined> => {
    try {
      return await authentication.executeWithRefresh(() => _workspaces.getWorkspace(ref));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const updateWorkspace = async (data: UpdateWorkspaceRequest): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() => _workspaces.updateWorkspace(data));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const deleteWorkspace = async (ref: string): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() => _workspaces.deleteWorkspace(ref));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const inviteUserToWorkspace = async (data: InviteUserToWorkspaceRequest): Promise<BaseApiObject | undefined> => {
    try {
      return await authentication.executeWithRefresh(() => _workspaces.inviteUserToWorkspace(data));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const resendWorkspaceMembershipInvitation = async (userRef: string): Promise<ResendWorkspaceMembershipInvitationResponse | undefined> => {
    try {
      return await authentication.executeWithRefresh(() => _workspaces.resendWorkspaceMembershipInvitation(userRef));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const removeUserFromWorkspace = async (userRef: string): Promise<RemoveUserFromWorkspaceResponse | undefined> => {
    try {
      return await authentication.executeWithRefresh(() => _workspaces.removeUserFromWorkspace(userRef));
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const listWorkspaceMembers = async (request: ListWorkspaceMembersRequest): Promise<ListWorkspaceMembersResponse | undefined> => {
    if (!isReady) return undefined;

    try {
      return await authentication.executeWithRefresh(() => _workspaces.listWorkspaceMembers(request));
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