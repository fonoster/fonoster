import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAPIKey } from "@/common/sdk/hooks/useAPIKey";
import APIKeyForm, {
  APIKeyFormData
} from "@/pages/workspace/[workspaceId]/api-keys/_components/form/APIKeyForm";
import { Box, CircularProgress } from "@mui/material";
import { Role } from "@fonoster/types";

export default function EditAPIKeyPage() {
  const router = useRouter();
  const { id } = router.query;
  const { listAPIKeys } = useAPIKey();
  const [apiKey, setApiKey] = useState<APIKeyFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAPIKey = async () => {
      if (id) {
        try {
          const response = await listAPIKeys({});

          if (response) {
            setTimeout(() => {
              setApiKey({
                name: "Example API Key",
                description: "Example description",
                role: Role.WORKSPACE_ADMIN,
                ref: id as string
              });
              setIsLoading(false);
            }, 1000);
          } else {
            setIsLoading(false);
          }
        } catch (error) {
          setError("Error loading API Key data");
          setIsLoading(false);
        }
      }
    };

    fetchAPIKey();
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

  if (!apiKey) {
    return <Box>API Key not found</Box>;
  }

  return (
    <APIKeyForm
      apiKeyId={id as string}
      formId="api-key-form"
      initialData={apiKey}
    />
  );
}
