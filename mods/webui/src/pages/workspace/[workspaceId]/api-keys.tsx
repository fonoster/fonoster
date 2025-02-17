import PageWithTable from '@/common/components/page-with-table';
import { Button } from '@mui/material';
import { Secret } from '@fonoster/types';
import { ColumnDef } from "@tanstack/react-table";


const columns: ColumnDef<Secret>[] = [
  {
    accessorKey: 'Name',
    header: 'name',
    cell: (info: any) => info.getValue(),
  },
];

export default function ApiKeysPage() {
  return (
    <PageWithTable>
      <PageWithTable.Header
        title="API Keys"
        actions={
          <Button variant="contained" onClick={() => { }}>
            Create New API Key
          </Button>
        }
      />
      <PageWithTable.Description>
        Manage your API keys for accessing Fonoster services.
      </PageWithTable.Description>

      <PageWithTable.Content<Secret> columns={columns} tableId="api-keys-table" />
    </PageWithTable>
  );
}