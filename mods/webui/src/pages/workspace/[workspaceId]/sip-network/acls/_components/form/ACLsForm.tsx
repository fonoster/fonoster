import PageContainer from '@/common/components/layout/pages';
import { Box, TextField, Button, Stack } from '@mui/material';
import router from 'next/router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export interface ACLsFormData {
  name: string;
  description: string;
  endpoint: string;
}

interface ACLsFormProps {
  initialData?: ACLsFormData;
  onSubmit: (data: ACLsFormData) => void;
  isLoading?: boolean;
}

export default function ACLsForm({ initialData, onSubmit, isLoading = false }: ACLsFormProps) {
  const router = useRouter();
  const { workspaceId } = router.query;

  const [formData, setFormData] = useState<ACLsFormData>(
    initialData || {
      name: '',
      description: '',
      endpoint: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const methods = useForm<ACLsFormData>({
    defaultValues: initialData,
  });

  return (
    <PageContainer>
      <PageContainer.Header title="Personal Settings"
        actions={<Button type="submit" variant="contained" size="large">SAVE CHANGES</Button>}
        backTo={{
          label: 'Back to Overview',
          onClick: () => router.push(`/workspace/${workspaceId}/overview`)
        }}
      />


      <PageContainer.ContentForm methods={methods} formId="user-settings-form">
      </PageContainer.ContentForm>
    </PageContainer>
  );
} 