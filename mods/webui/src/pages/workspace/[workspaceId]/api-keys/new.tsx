import APIKeyForm, {
  APIKeyFormData
} from "@/pages/workspace/[workspaceId]/api-keys/_components/form/APIKeyForm";
import { Role } from "@fonoster/types";

export default function NewAPIKeyPage() {
  const initialData: APIKeyFormData = {
    name: "",
    description: "",
    role: Role.WORKSPACE_ADMIN
  };

  return <APIKeyForm formId="api-key-form" initialData={initialData} />;
}
