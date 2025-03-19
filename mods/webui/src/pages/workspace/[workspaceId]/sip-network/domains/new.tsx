import DomainForm from "@/pages/workspace/[workspaceId]/sip-network/domains/_components/form/DomainForm";
import { useState, useEffect } from "react";

export default function NewDomainPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  return <DomainForm formId="domain-form" isLoading={isLoading} />;
}
