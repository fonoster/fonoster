import { useRouter } from 'next/router';
import { ColumnDef } from "@tanstack/react-table";
import ReactTable from "@/common/components/context-table/ReactTable"
import { Trunk } from '@fonoster/types';
import PageWithTable from '@/common/components/page-with-table';
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
    <PageWithTable>
      <PageWithTable.Header
        title="Trunks"
        actions={
          <Button variant="contained" onClick={() => { }}>
            New Trunk
          </Button>
        }
      />
      <PageWithTable.Description>
        Configure and manage your SIP trunks. Monitor trunk status and performance.
      </PageWithTable.Description>

      <PageWithTable.Content<Trunk> columns={columns} tableId="trunks-table" />
    </PageWithTable>
  );
} 