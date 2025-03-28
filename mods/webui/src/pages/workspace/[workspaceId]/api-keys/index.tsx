import PageContainer from "@/common/components/layout/pages";
import { Button } from "@mui/material";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { QueryData } from "@stories/table/QueryData";
import { Icon } from "@stories/icon/Icon";
import { useAPIKey } from "@/common/sdk/hooks/useAPIKey";

const columns: ColumnDef<any>[] = [
  {
    id: "name",
    header: "Name",
    cell: (props: { row: { original: any } }) => props.row.original.name
  }
];

export default function ApiKeysPage() {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();

  const { listAPIKeys } = useAPIKey();

  return (
    <PageContainer>
      <PageContainer.Header
        title="API Keys"
        actions={
          <Button
            variant="contained"
            onClick={() => {}}
            endIcon={<Icon fontSize="small" name="Add" />}
          >
            Upload New API Key
          </Button>
        }
      />
      <PageContainer.Subheader>
        Key management here. API keys are encrypted values that you can use to
        make calls to Fonoster’s APIs. Your API Keys are only available for use
        within this Workspace.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<any>
        columns={columns}
        tableId="api-keys-table"
        showSelectAll={true}
        options={{
          enableRowSelection: true
        }}
      >
        <QueryData<any> fetchFunction={listAPIKeys} pageSize={10} />
      </PageContainer.ContentTable>
    </PageContainer>
  );
}
