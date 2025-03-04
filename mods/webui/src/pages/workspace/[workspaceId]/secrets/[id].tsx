import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSecret } from "@/common/sdk/hooks/useSecret";
import SecretForm, {
  SecretFormData
} from "@/pages/workspace/[workspaceId]/secrets/_component/form/SecretForm";
import { Box, CircularProgress } from "@mui/material";

export default function EditSecretPage() {
  const router = useRouter();
  const { id } = router.query;
  const { getSecret } = useSecret();
  const [secret, setSecret] = useState<SecretFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSecret = async () => {
      if (id) {
        try {
          const response = await getSecret(id as string);

          if (response) {
            setSecret({
              name: response.name,
              secret: response.secret,
              ref: response.ref
            });
          }
          setIsLoading(false);
        } catch (error) {
          setError("Error loading Secret data");
          setIsLoading(false);
        }
      }
    };

    fetchSecret();
  }, [id]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Box>Error: {error}</Box>;
  }

  if (!secret) {
    return <Box>Secret not found</Box>;
  }

  return (
    <SecretForm
      secretId={id as string}
      formId="secret-form"
      initialData={secret}
    />
  );
}
