import PageContainer from '@/common/components/page-with-table';
import { Button } from '@mui/material';
import { CallDetailRecord } from '@fonoster/types';
import { ColumnDef } from "@tanstack/react-table";


const columns: ColumnDef<CallDetailRecord>[] = [
  {
    accessorKey: 'ref',
    header: 'Call Ref',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'Direction',
    header: 'direction',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'from',
    header: 'From',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'to',
    header: 'To',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'callType',
    header: 'Call Type',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'duration',
    header: 'Duration',
    cell: (info: any) => info.getValue(),
  },
];

export default function MonitoringPage() {
  return (
    <PageContainer>
      <PageContainer.Header
        title="Monitoring / Call Logs"
        actions={
          <Button variant="contained" onClick={() => { }}>
            Create New API Key
          </Button>
        }
      />
      <PageContainer.Subheader>
        Monitor your system performance and health metrics.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<CallDetailRecord> columns={columns} tableId="call-detail-records-table" />
    </PageContainer>
  );
} 