import PageContainer from '@/common/components/layout/pages';
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
    <PageContainer>
      <PageContainer.Header
        title="Secrets"
        actions={
          <Button variant="contained" onClick={() => { }}>
            Create New Secret
          </Button>
        }
      />
      <PageContainer.Subheader>
        Securely manage your application secrets and credentials.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<Secret> columns={columns} tableId="secrets-table" />
    </PageContainer>
  );
}