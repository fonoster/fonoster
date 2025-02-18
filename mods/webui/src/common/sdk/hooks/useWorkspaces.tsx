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
  Workspace
} from '@fonoster/types'

export const useWorkspaces = () => {
  const { client, isReady, SDK } = useFonosterClient();
  const { notifyError } = useNotification();

  const listWorkspaces = async (): Promise<ListWorkspacesResponse | undefined> => {
    if (!isReady) return undefined;

    try {
      const workspaces = new SDK.Workspaces(client);
      return await workspaces.listWorkspaces();
    } catch (error: any) {
      notifyError(error as ErrorType);
      return undefined;
    }
  };

  const createWorkspace = async (data: CreateWorkspaceRequest): Promise<Workspace | undefined> => {
    if (!isReady) return undefined;

    try {
      const workspaces = new SDK.Workspaces(client);
      return await workspaces.createWorkspace(data);
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const getWorkspace = async (ref: string): Promise<BaseApiObject | undefined>  => {
    try {
      const workspaces = new SDK.Workspaces(client);
      return await workspaces.getWorkspace(ref);
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const updateWorkspace = async (data: UpdateWorkspaceRequest): Promise<BaseApiObject | undefined> => {
    try {
      const workspaces = new SDK.Workspaces(client);
      return await workspaces.updateWorkspace(data);
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const deleteWorkspace = async (ref: string): Promise<BaseApiObject | undefined> => {
    try {
      const workspaces = new SDK.Workspaces(client);
      return await workspaces.deleteWorkspace(ref);
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const inviteUserToWorkspace = async (data: InviteUserToWorkspaceRequest): Promise<BaseApiObject | undefined> => {
    try {
      const workspaces = new SDK.Workspaces(client);
      return await workspaces.inviteUserToWorkspace(data);
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const resendWorkspaceMembershipInvitation = async (userRef: string): Promise<ResendWorkspaceMembershipInvitationResponse | undefined> => {
    try {
      const workspaces = new SDK.Workspaces(client);
      return await workspaces.resendWorkspaceMembershipInvitation(userRef);
    } catch (error: any) {
      notifyError(error as ErrorType);
    }
  };

  const removeUserFromWorkspace = async (userRef: string): Promise<RemoveUserFromWorkspaceResponse | undefined> => {
    try {
      const workspaces = new SDK.Workspaces(client);
      return await workspaces.removeUserFromWorkspace(userRef);
    } catch (error: any) {
      notifyError(error as ErrorType);
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
    removeUserFromWorkspace
  };
}; 