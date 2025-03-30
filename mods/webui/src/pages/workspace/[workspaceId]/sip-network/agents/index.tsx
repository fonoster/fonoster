import PageContainer from "@/common/components/layout/pages";
import { Button, CircularProgress, Box } from "@mui/material";
import { useRouter } from "next/router";
import { Agent } from "@fonoster/types";
import { ColumnDef } from "@tanstack/react-table";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { useAgents } from "@/common/sdk/hooks/useAgents";
import { useEffect, useState } from "react";
import { QueryData } from "@stories/table/QueryData";
import { Icon } from "@stories/icon/Icon";

const columns: ColumnDef<Agent>[] = [
  {
    id: "name",
    header: "Name",
    cell: (props: { row: { original: Agent } }) => props.row.original.name
  },
  {
    id: "username",
    header: "Username",
    cell: (props: { row: { original: Agent } }) => props.row.original.username
  },
  {
    id: "domain",
    header: "Domain",
    cell: (props: { row: { original: Agent } }) =>
      props.row.original.domain?.name || "-"
  },
  {
    id: "enabled",
    header: "Status",
    cell: (props: { row: { original: Agent } }) =>
      props.row.original.enabled ? "Enabled" : "Disabled"
  },
  {
    id: "privacy",
    header: "Privacy",
    cell: (props: { row: { original: Agent } }) => props.row.original.privacy
  }
];

export default function AgentsPage() {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { listAgents } = useAgents();

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
          <Button
            variant="outlined"
            onClick={handleNew}
            endIcon={<Icon fontSize="small" name="Add" />}
          >
            Create New Agent
          </Button>
        }
      />
      <PageContainer.Subheader>
        SIP Agents in the same Domain can call each other with Voice Over IP
        using a Software Phone (e.g Zoiper)
      </PageContainer.Subheader>

      <PageContainer.ContentTable<Agent>
        columns={columns}
        tableId="agents-table"
        showSelectAll={true}
      >
        <QueryData<Agent> fetchFunction={listAgents} pageSize={10} />
      </PageContainer.ContentTable>
    </PageContainer>
  );
}
