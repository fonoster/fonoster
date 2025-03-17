import PageContainer from "@/common/components/layout/pages";
import { Button } from "@mui/material";
import { Credentials } from "@fonoster/types";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";

const columns: ColumnDef<Credentials>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "username",
    header: "Username",
    cell: (info: any) => info.getValue()
  }
];

export default function CredentialsPage() {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();

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
          <Button variant="contained" onClick={handleNew}>
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
      />
    </PageContainer>
  );
}
