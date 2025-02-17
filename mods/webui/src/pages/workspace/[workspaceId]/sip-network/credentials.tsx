import PageWithTable from '@/common/components/page-with-table';
import { Button } from '@mui/material';
import { Credentials } from '@fonoster/types';
import { ColumnDef } from "@tanstack/react-table";


const columns: ColumnDef<Credentials>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'username',
    header: 'Username',
    cell: (info: any) => info.getValue(),
  }
];

export default function CredentialsPage() {
  return (
    <PageWithTable>
      <PageWithTable.Header
        title="Credentials"
        actions={
          <Button variant="contained" onClick={() => { }}>
            Create New Credential
          </Button>
        }
      />
      <PageWithTable.Description>
        Manage authentication credentials for your SIP network.
      </PageWithTable.Description>

      <PageWithTable.Content<Credentials> columns={columns} tableId="acl-table" />
    </PageWithTable>
  );
} 