import PageWithTable from '@/common/components/page-with-table';
import { Button } from '@mui/material';
import { Agent } from '@fonoster/types';
import { ColumnDef } from "@tanstack/react-table";


const columns: ColumnDef<Agent>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'size',
    header: 'Size',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'fileType',
    header: 'File Type',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'lastModified',
    header: 'Last Modified',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'info',
    header: 'Info',
    cell: (info: any) => info.getValue(),
  },
];

export default function StoragePage() {
  return (
    <PageWithTable>
      <PageWithTable.Header
        title="Storage"
        actions={
          <Button variant="contained" onClick={() => { }}>
            Upload New File
          </Button>
        }
      />
      <PageWithTable.Description>
        Manage your storage resources and configurations.
      </PageWithTable.Description>

      <PageWithTable.Content<Agent> columns={columns} tableId="storage-table" />
    </PageWithTable>
  );
} 