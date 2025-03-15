import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useACL } from "@/common/sdk/hooks/useACL";
import ACLsForm, {
  ACLsFormData
} from "@/pages/workspace/[workspaceId]/sip-network/acls/_components/form/ACLsForm";

export default function EditACLPage() {
  const router = useRouter();
  const { id } = router.query;
  const { getAcl } = useACL();
  const [acl, setAcl] = useState<ACLsFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchACL = async () => {
      if (id) {
        try {
          const response = await getAcl(id as string);
          if (response) {
            setAcl({
              name: response.name,
              allowedNetworks: response.allow || [],
              ref: response.ref
            });
          }
          setIsLoading(false);
        } catch (error) {
          setIsLoading(false);
        }
      }
    };

    fetchACL();
  }, [id]);

  return (
    <ACLsForm
      aclId={id as string}
      formId="acl-form"
      initialData={acl || undefined}
      isLoading={isLoading}
    />
  );
}
