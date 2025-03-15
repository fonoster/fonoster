import CredentialForm from "@/pages/workspace/[workspaceId]/sip-network/credentials/_components/form/CredentialForm";
import { useState, useEffect } from "react";

export default function NewCredentialPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  return <CredentialForm formId="credential-form" isLoading={isLoading} />;
}
