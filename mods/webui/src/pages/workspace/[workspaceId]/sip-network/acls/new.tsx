import ACLsForm, { ACLsFormData } from '@/pages/workspace/[workspaceId]/sip-network/acls/_components/form/ACLsForm';

export default function NewACLPage() {
  const initialData: ACLsFormData = {
    name: '',
    description: '',
    endpoint: '',
  };

  return (
    <ACLsForm
      formId="acl-form"
      initialData={initialData}
    />
  );
}
