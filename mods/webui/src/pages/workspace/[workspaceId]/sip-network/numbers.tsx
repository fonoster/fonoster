import { ColumnDef } from "@tanstack/react-table";
import { INumber } from '@fonoster/types';
import PageWithTable from '@/common/components/page-with-table';
import { Button } from '@mui/material';

const columns: ColumnDef<INumber>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'telUrl',
    header: 'Tel URL',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'address',
    header: 'Address',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'agentAOR',
    header: 'Agent AOR',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'application',
    header: 'Application',
    cell: (info: any) => info.getValue(),
  }
];

export default function NumbersPage() {
  return (
    <PageWithTable>
      <PageWithTable.Header
        title="Numbers"
        actions={
          <Button variant="contained" onClick={() => { }}>
            New Number
          </Button>
        }
      />
      <PageWithTable.Description>
        Manage your phone numbers inventory and configuration.
      </PageWithTable.Description>

      <PageWithTable.Content<INumber> columns={columns} tableId="numbers-table" />
    </PageWithTable>
  );
}