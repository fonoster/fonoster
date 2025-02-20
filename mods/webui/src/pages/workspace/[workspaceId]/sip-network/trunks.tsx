import { ColumnDef } from "@tanstack/react-table";
import { Trunk } from '@fonoster/types';
import PageContainer from '@/common/components/layout/pages';
import { Button } from '@mui/material';

const columns: ColumnDef<Trunk>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'sendRegister',
    header: 'Send Register',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'inboundSip',
    header: 'Inbound SIP',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'outboundSipUri',
    header: 'Outbound SIP URI',
    cell: (info: any) => info.getValue(),
  }
];

export default function TrunksPage() {
  return (
    <PageContainer>
      <PageContainer.Header
        title="Trunks"
        actions={
          <Button variant="contained" onClick={() => { }}>
            New Trunk
          </Button>
        }
      />
      <PageContainer.Subheader>
        Configure and manage your SIP trunks. Monitor trunk status and performance.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<Trunk> columns={columns} tableId="trunks-table" />
    </PageContainer>
  );
} 