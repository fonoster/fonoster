import { useParams } from "react-router";

export const useWorkspaceId = () => {
  const { workspaceId } = useParams();

  if (!workspaceId) {
    throw new Error("Oops! No workspaceId found in the URL");
  }

  return workspaceId;
};
