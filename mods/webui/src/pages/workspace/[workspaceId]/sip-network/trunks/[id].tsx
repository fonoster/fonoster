import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import TrunkForm, { TrunkFormData } from "./_components/form/TrunkForm";
import { useTrunks } from "@/common/sdk/hooks/useTrunks";
import { ErrorType, useNotification } from "@/common/hooks/useNotification";

export default function EditTrunkPage() {
  const router = useRouter();
  const { id } = router.query;
  const { getTrunk } = useTrunks();
  const { notifyError } = useNotification();
  const [initialData, setInitialData] = useState<TrunkFormData | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrunk = async () => {
      try {
        if (id && typeof id === "string") {
          const trunk = await getTrunk(id);
          if (trunk) {
            setInitialData({
              ref: trunk.ref,
              name: trunk.name,
              inboundUri: trunk.inboundUri || "",
              sendRegister: trunk.sendRegister || false,
              accessControlListRef: trunk.accessControlListRef,
              inboundCredentialsRef: trunk.inboundCredentialsRef,
              outboundCredentialsRef: trunk.outboundCredentialsRef,
              uris:
                trunk.uris?.map((uri) => ({
                  value: uri,
                  label: `${uri.host}:${uri.port} (${uri.transport})${uri.enabled ? "" : " (disabled)"}`
                })) || []
            });
          }
        }
      } catch (error: any) {
        notifyError(error as ErrorType);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrunk();
  }, [id]);

  return (
    <TrunkForm
      initialData={initialData}
      trunkId={id as string}
      isLoading={isLoading}
    />
  );
}
