import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/router';
import QueryUsers, { User } from "@/common/components/context-table/Examples/QueryUser";
import { ColumnDef } from "@tanstack/react-table";
import ReactTable from "@/common/components/context-table/ReactTable"


const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: (info: any) => info.getValue(),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: (info: any) => info.getValue(),
  },
];

export default function ApplicationsPage() {
  const router = useRouter();
  const { workspaceId } = router.query;

  const handleCreateNew = () => {
    router.push(`/workspace/${workspaceId}/applications/new`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Aplicaciones
        </Typography>
        <Button variant="contained" onClick={handleCreateNew}>
          Nueva Aplicación
        </Button>
      </Box>

      <Typography variant="body1">
        Administra todas tus aplicaciones Fonoster aquí. Crea, edita y monitorea tus aplicaciones en ejecución.
      </Typography>
      <ReactTable<User> columns={columns} >
                <QueryUsers />
            </ReactTable>
    </Box>
  );
} 