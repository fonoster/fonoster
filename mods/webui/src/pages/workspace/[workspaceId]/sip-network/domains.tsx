import { ColumnDef } from "@tanstack/react-table";
import { Domain } from '@fonoster/types';
import PageWithTable from '@/common/components/page-with-table';
import { Button } from '@mui/material';

const columns: ColumnDef<Domain>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'domainUri',
    header: 'Domain URI',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'egressRules',
    header: 'Egress Rules',
    cell: (info: any) => info.getValue(),
  }
];

export default function DomainsPage() {
  return (
    <PageWithTable>
      <PageWithTable.Header
        title="Domains"
        actions={
          <Button variant="contained" onClick={() => { }}>
            New Domain
          </Button>
        }
      />
      <PageWithTable.Description>
        Configure and manage your SIP domains and related settings.
      </PageWithTable.Description>

      <PageWithTable.Content<Domain> columns={columns} tableId="domains-table" />
    </PageWithTable>
  );
} 