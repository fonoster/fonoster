import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useCredential } from "@/common/sdk/hooks/useCredential";
import CredentialForm, {
  CredentialFormData
} from "@/pages/workspace/[workspaceId]/sip-network/credentials/_components/form/CredentialForm";

export default function EditCredentialPage() {
  const router = useRouter();
  const { workspaceId, id } = router.query;
  const { getCredentials } = useCredential();
  const [credential, setCredential] = useState<CredentialFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          setIsLoading(false);
        }
      }
    };

    fetchCredential();
  }, [workspaceId, id]);

  return (
    <CredentialForm
      credentialId={id as string}
      formId="credential-form"
      initialData={credential}
      isLoading={isLoading}
    />
  );
}
