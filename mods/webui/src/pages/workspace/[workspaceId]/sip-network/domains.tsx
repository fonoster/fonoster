import { ColumnDef } from "@tanstack/react-table";
import { Domain } from "@fonoster/types";
import PageContainer from "@/common/components/layout/pages";
import { Button } from "@mui/material";

const columns: ColumnDef<Domain>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "domainUri",
    header: "Domain URI",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "egressRules",
    header: "Egress Rules",
    cell: (info: any) => info.getValue()
  }
];

export default function DomainsPage() {
  return (
    <PageContainer>
      <PageContainer.Header
        title="Domains"
        actions={
          <Button variant="contained" onClick={() => {}}>
            New Domain
          </Button>
        }
      />
      <PageContainer.Subheader>
        Configure and manage your SIP domains and related settings.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<Domain>
        columns={columns}
        tableId="domains-table"
      />
    </PageContainer>
  );
}
