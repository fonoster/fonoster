import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDomains } from "@/common/sdk/hooks/useDomains";
import DomainForm, {
  DomainFormData
} from "@/pages/workspace/[workspaceId]/sip-network/domains/_components/form/DomainForm";

export default function EditDomainPage() {
  const router = useRouter();
  const { workspaceId, id } = router.query;
  const { getDomain } = useDomains();
  const [domain, setDomain] = useState<DomainFormData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDomain = async () => {
      if (id) {
        try {
          const response = await getDomain(id as string);
          if (response) {
            setDomain({
              name: response.name,
              domainUri: response.domainUri,
              egressRules: response.egressPolicies || [],
              ref: response.ref
            });
          }
          setIsLoading(false);
        } catch (error) {
          setIsLoading(false);
        }
      }
    };

    fetchDomain();
  }, [workspaceId, id]);

  return (
    <DomainForm
      domainId={id as string}
      formId="domain-form"
      initialData={domain}
      isLoading={isLoading}
    />
  );
}
