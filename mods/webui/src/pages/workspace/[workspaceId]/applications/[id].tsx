import ApplicationForm, {
  ApplicationFormData
} from "@/pages/workspace/[workspaceId]/applications/_components/form/ApplicationForm";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useApplications } from "@/common/sdk/hooks/useApplications";
import { Application } from "@fonoster/types";

export default function EditApplicationPage() {
  const router = useRouter();
  const { workspaceId, id } = router.query;
  const [application, setApplication] = useState<ApplicationFormData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const { getApplication } = useApplications();

  useEffect(() => {
    const fetchApplication = async () => {
      if (id && workspaceId) {
        try {
          setIsLoading(true);
          const app = await getApplication(id as string);
          setApplication(app as ApplicationFormData);
        } catch (error) {
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchApplication();
  }, [id, workspaceId]);

  return <ApplicationForm initialValues={application} isLoading={isLoading} />;
}
