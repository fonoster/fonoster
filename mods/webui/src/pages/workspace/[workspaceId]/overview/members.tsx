import PageContainer from '@/common/components/layout/pages';
import { Button } from '@mui/material';
import { User } from '@fonoster/types';
import { ColumnDef } from "@tanstack/react-table";
import router, { useRouter } from 'next/router';


const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'NAME',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'email',
    header: 'EMAIL',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'role',
    header: 'ROLE',
    cell: (info: any) => info.getValue(),
  }, {
    accessorKey: 'role',
    header: 'DATE ADDED',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'status',
    header: 'STATUS',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'actions',
    header: 'ACTIONS',
    cell: (info: any) => info.getValue(),
  }
];


export default function MembersPage() {
  const router = useRouter();
  const { workspaceId } = router.query;

  return (
    <PageContainer>
      <PageContainer.Header
        title="Workspace Members"
        actions={
          <Button variant="contained" onClick={() => { }}>
            Invite new member
          </Button>
        }
        backTo={{
          label: 'Back to Overview',
          onClick: () => router.push(`/workspace/${workspaceId}/overview`)
        }}
      />
      <PageContainer.Subheader>
        Manage your workspace members and their roles.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<User> columns={columns} tableId="members-table" />
    </PageContainer>
  );
} 