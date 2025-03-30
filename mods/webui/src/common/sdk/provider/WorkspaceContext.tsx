import React, { createContext, useState, useContext, useEffect } from "react";
import { Workspace } from "@fonoster/types";
import { useRouter } from "next/router";
import { useWorkspaces } from "../hooks/useWorkspaces";
import { useFonosterClient } from "../hooks/useFonosterClient";
import { LoadingScreen } from "@/common/components/loading/LoadingScreen";

interface WorkspaceContextType {
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  isLoading: boolean;
  refreshWorkspaces: () => Promise<void>;
  handleSetSelectedWorkspace: (workspaceId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaces: [],
  selectedWorkspace: null,
  isLoading: true,
  refreshWorkspaces: async () => {},
  handleSetSelectedWorkspace: () => {}
});

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { client, isReady, isAuthenticated } = useFonosterClient();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const { listWorkspaces } = useWorkspaces();
  const router = useRouter();
  const { workspaceId } = router.query;

  useEffect(() => {
    if (isReady && !authChecked) {
      setAuthChecked(true);

      refreshWorkspaces();
    }
  }, [isReady, authChecked, router]);

  const refreshWorkspaces = async () => {
    if (!isReady) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await listWorkspaces();
      if (response?.items) {
        setWorkspaces(response.items);
      }
    } catch (error) {
      //notify error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetSelectedWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.ref === workspaceId);
    if (workspace) {
      setSelectedWorkspace(workspace);
      if (client && workspace.accessKeyId) {
        client.setAccessKeyId(workspace.accessKeyId);
      }
    }
  };

  useEffect(() => {
    if (workspaceId && workspaces.length > 0 && isReady && isAuthenticated) {
      handleSetSelectedWorkspace(workspaceId as string);
    }
  }, [workspaceId, workspaces, client, isReady, isAuthenticated]);

  if (isLoading) {
    return <LoadingScreen logoSize="large" />;
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        selectedWorkspace,
        isLoading,
        refreshWorkspaces,
        handleSetSelectedWorkspace: handleSetSelectedWorkspace
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspaceContext = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error(
      "useWorkspaceContext must be used within WorkspaceProvider"
    );
  }
  return context;
};
