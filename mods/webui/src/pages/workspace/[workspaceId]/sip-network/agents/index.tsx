import PageContainer from "@/common/components/layout/pages";
import { Button, CircularProgress, Box } from "@mui/material";
import { useRouter } from "next/router";
import { Agent } from "@fonoster/types";
import { ColumnDef } from "@tanstack/react-table";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { useAgents } from "@/common/sdk/hooks/useAgents";
import { useEffect, useState } from "react";

const columns: ColumnDef<Agent>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "username",
    header: "Username",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "domain",
    header: "Domain",
    cell: (info: any) => info.getValue()?.name || "-"
  },
  {
    accessorKey: "enabled",
    header: "Status",
    cell: (info: any) => (info.getValue() ? "Enabled" : "Disabled")
  },
  {
    accessorKey: "privacy",
    header: "Privacy",
    cell: (info: any) => info.getValue()
  }
];

export default function AgentsPage() {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { listAgents } = useAgents();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await listAgents();
        if (response && response.items) {
          setAgents(response.items);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching agents:", error);
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const handleNew = () => {
    router.push(`/workspace/${selectedWorkspace?.ref}/sip-network/agents/new`);
  };

  const handleRowClick = (agent: Agent) => {
    router.push(
      `/workspace/${selectedWorkspace?.ref}/sip-network/agents/${agent.ref}`
    );
  };

  return (
    <PageContainer>
      <PageContainer.Header
        title="Agents"
        actions={
          <Button variant="contained" onClick={handleNew}>
            New Agent
          </Button>
        }
      />
      <PageContainer.Subheader>
        Manage your SIP agents and their configurations.
      </PageContainer.Subheader>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <PageContainer.ContentTable<Agent>
          columns={columns}
          tableId="agents-table"
        />
      )}
    </PageContainer>
  );
}
