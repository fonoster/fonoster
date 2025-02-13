import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/router';

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
    </Box>
  );
} 