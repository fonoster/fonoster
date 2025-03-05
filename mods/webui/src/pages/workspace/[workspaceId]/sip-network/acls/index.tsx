import PageContainer from "@/common/components/layout/pages";
import { Button } from "@mui/material";
import { Acl } from "@fonoster/types";
import { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<Acl>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "denyList",
    header: "Deny List",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "allowList",
    header: "Allow List",
    cell: (info: any) => info.getValue()
  }
];

export default function AclsPage() {
  return (
    <PageContainer>
      <PageContainer.Header
        title="IP/CIDR Access Control List (ACL)"
        actions={
          <Button variant="contained" onClick={() => {}}>
            Create New Agent
          </Button>
        }
      />
      <PageContainer.Subheader>
        Create an Access Control List (ACL) to allow or deny access from
        external networks to your infrastructure.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<Acl> columns={columns} tableId="acl-table" />
    </PageContainer>
  );
}
