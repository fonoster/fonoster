import { Box, Typography } from '@mui/material';
import ApplicationForm, { ApplicationFormData } from '@/pages/workspace/[workspaceId]/applications/_components/form/ApplicationForm';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function EditApplicationPage() {
  const router = useRouter();
  const { workspaceId, id } = router.query;
  const [application, setApplication] = useState<ApplicationFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplication = async () => {
      if (id) {
        try {
          // Aquí implementarías la lógica para obtener la aplicación
          // Por ejemplo:
          // const data = await getApplication(workspaceId as string, id as string);
          // setApplication(data);
          
          // Por ahora, usamos datos de ejemplo
          setApplication({
            name: 'Aplicación de ejemplo',
            description: 'Descripción de ejemplo',
            endpoint: 'https://ejemplo.com',
          });
        } catch (error) {
          console.error('Error al obtener la aplicación:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchApplication();
  }, [id, workspaceId]);

  const handleSubmit = async (data: ApplicationFormData) => {
    try {
      // Aquí implementarías la lógica para actualizar la aplicación
      // Por ejemplo:
      // await updateApplication(workspaceId as string, id as string, data);
      
      // Redirigir a la lista de aplicaciones después de actualizar
      router.push(`/workspace/${workspaceId}/applications`);
    } catch (error) {
      console.error('Error al actualizar la aplicación:', error);
      // Aquí podrías mostrar un mensaje de error
    }
  };

  if (isLoading) {
    return <Box>Cargando...</Box>;
  }

  if (!application) {
    return <Box>No se encontró la aplicación</Box>;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Editar Aplicación
      </Typography>
      
      <ApplicationForm 
        initialData={application}
        onSubmit={handleSubmit}
      />
    </Box>
  );
}
