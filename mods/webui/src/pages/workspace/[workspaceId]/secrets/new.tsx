import SecretForm, {
  SecretFormData
} from "@/pages/workspace/[workspaceId]/secrets/_component/form/SecretForm";

export default function NewSecretPage() {
  const initialData: SecretFormData = {
    name: "",
    secret: ""
  };

  return <SecretForm formId="secret-form" initialData={initialData} />;
}
