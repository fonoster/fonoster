import { Box, Typography } from '@mui/material';
import ACLsForm, { ACLsFormData } from '@/pages/workspace/[workspaceId]/sip-network/acls/_components/form/ACLsForm';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function EditACLsPage() {
  const router = useRouter();
  const { workspaceId, id } = router.query;
  const [acl, setAcl] = useState<ACLsFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplication = async () => {
      if (id) {
        try {
          setAcl({
            name: 'Aplicación de ejemplo',
            description: 'Descripción de ejemplo',
            endpoint: 'https://ejemplo.com',
          });
        } catch (error) {
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchApplication();
  }, [id, workspaceId]);

  const handleSubmit = async (data: ACLsFormData) => {
    try {
      router.push(`/workspace/${workspaceId}/sip-network/acls`);
    } catch (error) {
    }
  };

  if (isLoading) {
    return <Box>Cargando...</Box>;
  }

  if (!acl) {
    return <Box>No se encontró la aplicación</Box>;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Editar ACLs
      </Typography>

      <ACLsForm
        initialData={acl}
        onSubmit={handleSubmit}
      />
    </Box>
  );
}
