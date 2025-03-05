import CredentialForm, {
  CredentialFormData
} from "@/pages/workspace/[workspaceId]/sip-network/credentials/_components/form/CredentialForm";

export default function NewCredentialPage() {
  const initialData: CredentialFormData = {
    name: "",
    username: "",
    password: "",
    confirmPassword: ""
  };

  return <CredentialForm formId="credential-form" initialData={initialData} />;
}
