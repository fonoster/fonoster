import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useCredential } from "@/common/sdk/hooks/useCredential";
import CredentialForm, {
  CredentialFormData
} from "@/pages/workspace/[workspaceId]/sip-network/credentials/_components/form/CredentialFormm";
import { Box, CircularProgress } from "@mui/material";

export default function EditCredentialPage() {
  const router = useRouter();
  const { id } = router.query;
  const { getCredentials } = useCredential();
  const [credential, setCredential] = useState<CredentialFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredential = async () => {
      if (id) {
        try {
          const response = await getCredentials(id as string);

          if (response) {
            setCredential({
              name: response.name,
              username: response.username,
              password: "",
              confirmPassword: "",
              ref: response.ref
            });
          }
          setIsLoading(false);
        } catch (error) {
          setError("Error loading Credential data");
          setIsLoading(false);
        }
      }
    };

    fetchCredential();
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

  if (!credential) {
    return <Box>Credential not found</Box>;
  }

  return (
    <CredentialForm
      credentialId={id as string}
      formId="credential-form"
      initialData={credential}
    />
  );
}
