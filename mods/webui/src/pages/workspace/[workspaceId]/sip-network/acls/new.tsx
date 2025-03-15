import ACLsForm from "@/pages/workspace/[workspaceId]/sip-network/acls/_components/form/ACLsForm";
import { useState, useEffect } from "react";

export default function NewACLPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  return <ACLsForm formId="acl-form" isLoading={isLoading} />;
}
