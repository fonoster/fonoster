import PageContainer from "@/common/components/layout/pages";
import { Button } from "@mui/material";
import { Acl } from "@fonoster/types";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { Icon } from "@stories/icon/Icon";
import QueryData from "@/common/contexts/table/QueryData";
import { useACL } from "@/common/sdk/hooks/useACL";

const columns: ColumnDef<Acl>[] = [
  {
    id: "name",
    header: "Name",
    cell: (info: { row: { original: Acl } }) => info.row.original.name
  },
  {
    id: "deny",
    header: "Deny List",
    cell: (info: { row: { original: any } }) => info.row.original.deny.map((d: any) => d)
  },
  {
    id: "allow",
    header: "Allow List",
    cell: (info: { row: { original: Acl } }) => info.row.original.allow.map((a) => a)
  }
];

export default function AclsPage() {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { listAcls } = useACL();

  const handleNew = () => {
    router.push(`/workspace/${selectedWorkspace?.ref}/sip-network/acls/new`);
  };

  return (
    <PageContainer>
      <PageContainer.Header
        title="IP/CIDR Access Control List (ACL)"
        actions={
          <Button variant="contained" onClick={handleNew} endIcon={<Icon fontSize="small" name="Add" />}>
            Create New ACL
          </Button>
        }
      />
      <PageContainer.Subheader>
        Create an Access Control List (ACL) to allow or deny access from external networks to your infrastructure.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<Acl>
        columns={columns}
        tableId="acl-table"
        showSelectAll={true}
        options={{
          enableRowSelection: true
        }}
      >
        <QueryData<Acl> fetchFunction={listAcls} pageSize={10} />

      </PageContainer.ContentTable>
    </PageContainer>
  );
}
