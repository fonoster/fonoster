import PageWithTable from '@/common/components/page-with-table';
import { Button } from '@mui/material';
import { Secret } from '@fonoster/types';
import { ColumnDef } from "@tanstack/react-table";


const columns: ColumnDef<Secret>[] = [
  {
    accessorKey: 'secrets',
    header: 'Secrets',
    cell: (info: any) => info.getValue(),
  },
];


export default function SecretsPage() {
  return (
    <PageWithTable>
      <PageWithTable.Header
        title="Secrets"
        actions={
          <Button variant="contained" onClick={() => { }}>
            Create New Secret
          </Button>
        }
      />
      <PageWithTable.Description>
        Securely manage your application secrets and credentials.
      </PageWithTable.Description>

      <PageWithTable.Content<Secret> columns={columns} tableId="secrets-table" />
    </PageWithTable>
  );
}