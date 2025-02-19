import PageContainer from '@/common/components/content/PageLayout';
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
    <PageContainer>
      <PageContainer.Header
        title="API Keys"
        actions={
          <Button variant="contained" onClick={() => { }}>
            Create New API Key
          </Button>
        }
      />
      <PageContainer.Subheader>
        Manage your API keys for accessing Fonoster services.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<Secret> columns={columns} tableId="api-keys-table" />
    </PageContainer>
  );
}