import AgentForm from "@/pages/workspace/[workspaceId]/sip-network/agents/_components/form/AgentForm";
import { useState, useEffect } from "react";

export default function NewAgentPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  return <AgentForm formId="agent-form" isLoading={isLoading} />;
}
