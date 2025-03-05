import { Box, Typography } from "@mui/material";
import ApplicationForm, {
  ApplicationFormData
} from "@/pages/workspace/[workspaceId]/applications/_components/form/ApplicationForm";
import { useRouter } from "next/router";

export default function NewApplicationPage() {
  const router = useRouter();
  const { workspaceId } = router.query;

  const handleSubmit = async (data: ApplicationFormData) => {
    try {
      router.push(`/workspace/${workspaceId}/applications`);
    } catch (error) {
      console.error("Error al crear la aplicación:", error);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Crear Nueva Aplicación
      </Typography>

      <ApplicationForm onSubmit={handleSubmit} />
    </Box>
  );
}
