import PageContainer from '@/common/components/layout/pages';
import { Button } from '@mui/material';
import { Secret } from '@fonoster/types';
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from 'next/router';
import { useWorkspaceContext } from '@/common/sdk/provider/WorkspaceContext';


const columns: ColumnDef<Secret>[] = [
  {
    accessorKey: 'secrets',
    header: 'Secrets',
    cell: (info: any) => info.getValue(),
  },
];


export default function SecretsPage() { 
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  return (
    <PageContainer>
      <PageContainer.Header
        title="Secrets"
        actions={
          <Button variant="contained" onClick={() => router.push(`/workspace/${selectedWorkspace?.ref}/secrets/new`)}>
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