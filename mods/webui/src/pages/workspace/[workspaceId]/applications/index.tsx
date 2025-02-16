import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/router';
import { ColumnDef } from "@tanstack/react-table";
import ReactTable from "@/common/components/context-table/ReactTable"
import QueryApplications from './_components/QueryApplications';
import { Application } from '@fonoster/types';


const columns: ColumnDef<Application>[] = [
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
      <ReactTable<Application> columns={columns} >
                <QueryApplications />
            </ReactTable>
    </Box>
  );
} 