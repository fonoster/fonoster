import { useRouter } from 'next/router';
import { ColumnDef } from "@tanstack/react-table";
import { Application } from '@fonoster/types';
import PageContainer from '@/common/components/page-with-table';
import { Button } from '@mui/material';

const columns: ColumnDef<Application>[] = [
  {
    accessorKey: 'ref',
    header: 'Ref',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'projectId',
    header: 'Project ID',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'tts',
    header: 'TTS',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'stt',
    header: 'STT',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'intelligence',
    header: 'Inteligence',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    cell: (info: any) => info.getValue(),
  },
];

export default function ApplicationsPage() {
  const router = useRouter();
  const { workspaceId } = router.query;

  return (

    <PageContainer>
      <PageContainer.Header
        title="Applications"
        actions={
          <Button variant="contained" onClick={() => { }}>
            New Application
          </Button>
        }
      />
      <PageContainer.Subheader>
        Manage all your Fonoster applications here. Create, edit and monitor your applications in execution.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<Application> columns={columns} tableId="applications-table" />
    </PageContainer>
  );
}