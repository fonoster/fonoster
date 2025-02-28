import PageContainer from '@/common/components/layout/pages';
import { Button, Box, Typography, Alert, Snackbar } from '@mui/material';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InputContext } from '@/common/hooksForm/InputContext';
import { useACL } from '@/common/sdk/hooks/useACL';
import { useWorkspaceContext } from '@/common/sdk/provider/WorkspaceContext';

const aclSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  endpoint: z.string().min(1, 'Endpoint is required'),
  ref: z.string().optional()
});

const editModeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  endpoint: z.string(),
  ref: z.string().optional()
});

export type ACLsFormData = z.infer<typeof aclSchema>;

interface ACLsFormProps {
  initialData?: ACLsFormData;
  formId?: string;
  aclId?: string | null;
}

export default function ACLsForm({
  initialData,
  formId = 'acl-form',
  aclId
}: ACLsFormProps) {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { createAcl, updateAcl } = useACL();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditMode = !!aclId;

  const schema = isEditMode ? editModeSchema : aclSchema;

  const methods = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      endpoint: initialData?.endpoint || '',
      ref: initialData?.ref || ''
    }
  });

  const handleSubmit = methods.handleSubmit(async (data) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!isEditMode) {
        const result = await createAcl({
          name: data.name,
          allow: [data.endpoint]
        });

        if (result) {
          setSuccess('ACL created successfully');
          setTimeout(() => {
            router.push(`/workspace/${selectedWorkspace?.ref}/sip-network/acls`);
          }, 1500);
        }
      } else {
        const result = await updateAcl({
          ref: aclId as string,
          name: data.name,
          deny: []
        });

        if (result) {
          setSuccess('ACL updated successfully');
          setTimeout(() => {
            router.push(`/workspace/${selectedWorkspace?.ref}/sip-network/acls`);
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error(`Error ${!isEditMode ? 'creating' : 'updating'} ACL:`, error);
      setError(error.message || `Failed to ${!isEditMode ? 'create' : 'update'} ACL`);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <PageContainer>
      <PageContainer.Header
        title={!isEditMode ? 'Create New ACL' : 'Edit ACL'}
        backTo={{
          label: 'Back to ACLs',
          onClick: () => router.push(`/workspace/${selectedWorkspace?.ref}/sip-network/acls`)
        }}
        actions={
          <Button
            type="submit"
            form={formId}
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {!isEditMode ? 'Create ACL' : 'Update ACL'}
          </Button>
        }
      />
      <PageContainer.ContentForm methods={methods} formId={formId}>
        <InputContext
          name="name"
          label="ACL Name"
          type="text"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-name`}
        />

        {!isEditMode ? (
          <>
            <InputContext
              name="description"
              label="Description"
              type="text"
              leadingIcon={null}
              trailingIcon={null}
              id={`${formId}-description`}
            />

            <InputContext
              name="endpoint"
              label="Endpoint"
              type="text"
              leadingIcon={null}
              trailingIcon={null}
              id={`${formId}-endpoint`}
            />
          </>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1">
                {initialData?.description || ''}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Description cannot be changed after creation
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Endpoint
              </Typography>
              <Typography variant="body1">
                {initialData?.endpoint || ''}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Endpoint cannot be changed after creation
              </Typography>
            </Box>
          </>
        )}

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="error">
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSuccess(null)} severity="success">
            {success}
          </Alert>
        </Snackbar>
      </PageContainer.ContentForm>
    </PageContainer>
  );
} 