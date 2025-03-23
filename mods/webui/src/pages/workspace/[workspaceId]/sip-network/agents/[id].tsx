import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAgents } from "@/common/sdk/hooks/useAgents";
import AgentForm, {
  AgentFormData
} from "@/pages/workspace/[workspaceId]/sip-network/agents/_components/form/AgentForm";

export default function EditAgentPage() {
  const router = useRouter();
  const { workspaceId, id } = router.query;
  const { getAgent } = useAgents();
  const [agent, setAgent] = useState<AgentFormData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgent = async () => {
      if (id) {
        try {
          const response = await getAgent(id as string);
          if (response) {
            setAgent({
              name: response.name,
              username: response.username,
              privacy: response.privacy,
              enabled: response.enabled,
              maxContacts: response.maxContacts || 1,
              expires: response.expires || 3600,
              domainRef: response.domain?.ref,
              credentialsRef: response.credentials?.ref,
              ref: response.ref
            });
          }
          setIsLoading(false);
        } catch (error) {
          setIsLoading(false);
        }
      }
    };

    fetchAgent();
  }, [workspaceId, id]);

  return (
    <AgentForm
      agentId={id as string}
      formId="agent-form"
      initialData={agent}
      isLoading={isLoading}
    />
  );
}
