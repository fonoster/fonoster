import { ColumnDef } from "@tanstack/react-table";
import { INumber } from "@fonoster/types";
import PageContainer from "@/common/components/layout/pages";
import { Button } from "@mui/material";

const columns: ColumnDef<INumber>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "telUrl",
    header: "Tel URL",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "agentAOR",
    header: "Agent AOR",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "application",
    header: "Application",
    cell: (info: any) => info.getValue()
  }
];

export default function NumbersPage() {
  return (
    <PageContainer>
      <PageContainer.Header
        title="Numbers"
        actions={
          <Button variant="contained" onClick={() => {}}>
            New Number
          </Button>
        }
      />
      <PageContainer.Subheader>
        Manage your phone numbers inventory and configuration.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<INumber>
        columns={columns}
        tableId="numbers-table"
      />
    </PageContainer>
  );
}
