import PageContainer from "@/common/components/layout/pages";
import { Button } from "@mui/material";
import { Secret } from "@fonoster/types";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";

const columns: ColumnDef<Secret>[] = [
  {
    accessorKey: "Name",
    header: "name",
    cell: (info: any) => info.getValue()
  }
];

export default function ApiKeysPage() {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();

  return (
    <PageContainer>
      <PageContainer.Header
        title="API Keys"
        actions={
          <Button
            variant="contained"
            onClick={() =>
              router.push(`/workspace/${selectedWorkspace?.ref}/api-keys/new`)
            }
          >
            Create New API Key
          </Button>
        }
      />
      <PageContainer.Subheader>
        Manage your API keys for accessing Fonoster services.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<Secret>
        columns={columns}
        tableId="api-keys-table"
      />
    </PageContainer>
  );
}
