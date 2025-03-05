import { Box, Typography } from "@mui/material";
import ApplicationForm, {
  ApplicationFormData
} from "@/pages/workspace/[workspaceId]/applications/_components/form/ApplicationForm";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function EditApplicationPage() {
  const router = useRouter();
  const { workspaceId, id } = router.query;
  const [application, setApplication] = useState<ApplicationFormData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplication = async () => {
      if (id) {
        try {
          setApplication({
            name: "Aplicación de ejemplo",
            description: "Descripción de ejemplo",
            endpoint: "https://ejemplo.com"
          });
        } catch (error) {
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchApplication();
  }, [id, workspaceId]);

  const handleSubmit = async (data: ApplicationFormData) => {
    try {
      router.push(`/workspace/${workspaceId}/applications`);
    } catch (error) {}
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

      <ApplicationForm initialData={application} onSubmit={handleSubmit} />
    </Box>
  );
}
