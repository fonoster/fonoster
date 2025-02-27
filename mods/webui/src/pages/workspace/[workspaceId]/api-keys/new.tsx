import APIKeyForm, { APIKeyFormData } from '@/pages/workspace/[workspaceId]/api-keys/_components/form/APIKeyForm';
import { useRouter } from 'next/router';
import { Role } from '@fonoster/types';

export default function NewAPIKeyPage() {
  const router = useRouter();
  const { workspaceId } = router.query;

  const initialData: APIKeyFormData = {
    name: '',
    description: '',
    role: Role.WORKSPACE_ADMIN,
  };

  return (
    <APIKeyForm
      workspaceId={workspaceId as string}
      formId="api-key-form"
      initialData={initialData}
    />
  );
}
