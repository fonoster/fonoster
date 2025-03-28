import PageContainer from "@/common/components/layout/pages";
import { Credentials } from "@fonoster/types";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { useCredential } from "@/common/sdk/hooks/useCredential";
import { QueryData } from "@stories/table/QueryData";
import { Icon } from "@stories/icon/Icon";
import { Button } from "@stories/button/Button";

const columns: ColumnDef<Credentials>[] = [
  {
    id: "name",
    header: "Name",
    cell: (info: { row: { original: Credentials } }) => info.row.original.name
  },
  {
    id: "username",
    header: "Username",
    cell: (info: { row: { original: Credentials } }) =>
      info.row.original.username
  }
];

export default function CredentialsPage() {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();

  const { listCredentials } = useCredential();

  const handleNew = () => {
    router.push(
      `/workspace/${selectedWorkspace?.ref}/sip-network/credentials/new`
    );
  };

  return (
    <PageContainer>
      <PageContainer.Header
        title="Credentials"
        actions={
          <Button
            variant="outlined"
            onClick={handleNew}
            endIcon={<Icon fontSize="small" name="Add" />}
          >
            Create New Credential
          </Button>
        }
      />
      <PageContainer.Subheader>
        Manage authentication credentials for your SIP network.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<Credentials>
        columns={columns}
        tableId="credential-table"
        showSelectAll={true}
      >
        <QueryData<Credentials> fetchFunction={listCredentials} pageSize={10} />
      </PageContainer.ContentTable>
    </PageContainer>
  );
}
