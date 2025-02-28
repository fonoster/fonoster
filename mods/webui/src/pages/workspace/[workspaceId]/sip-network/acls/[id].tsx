import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useACL } from '@/common/sdk/hooks/useACL';
import ACLsForm, { ACLsFormData } from '@/pages/workspace/[workspaceId]/sip-network/acls/_components/form/ACLsForm';
import { Box, CircularProgress } from '@mui/material';

export default function EditACLPage() {
  const router = useRouter();
  const { id } = router.query;
  const { getAcl } = useACL();
  const [acl, setAcl] = useState<ACLsFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchACL = async () => {
      if (id) {
        try {
          const response = await getAcl(id as string);

          if (response) {
            const endpoint = response.allow && response.allow.length > 0 ? response.allow[0] : '';

            setAcl({
              name: response.name,
              description: '',
              endpoint: endpoint,
              ref: response.ref
            });
          }
          setIsLoading(false);
        } catch (error) {
          setError('Error loading ACL data');
          setIsLoading(false);
        }
      }
    };

    fetchACL();
  }, [id]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        Error: {error}
      </Box>
    );
  }

  if (!acl) {
    return (
      <Box>
        ACL not found
      </Box>
    );
  }

  return (
    <ACLsForm
      aclId={id as string}
      formId="acl-form"
      initialData={acl}
    />
  );
}
