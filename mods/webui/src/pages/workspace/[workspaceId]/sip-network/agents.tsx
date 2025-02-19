import PageContainer from '@/common/components/content/PageLayout';
import { Button } from '@mui/material';
import { useRouter } from 'next/router';
import { Agent } from '@fonoster/types';
import { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<Agent>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'username',
    header: 'Username',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'domain',
    header: 'Domain',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'privacy',
    header: 'Privacy',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info: any) => info.getValue(),
  }
];

export default function AgentsPage() {
  const router = useRouter();
  const { workspaceId } = router.query;

  return (
    <PageContainer>
      <PageContainer.Header
        title="Agents"
        actions={
          <Button variant="contained" onClick={() => { }}>
            New Agent
          </Button>
        }
      />
      <PageContainer.Subheader>
        Manage your SIP agents and their configurations.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<Agent> columns={columns} tableId="agents-table" />
    </PageContainer>
  );
} 