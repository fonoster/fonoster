import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import TrunkForm from "./_components/form/TrunkForm";
import { TrunkFormData } from "./_components/form/TrunkForm";
import { useTrunks } from "@/common/sdk/hooks/useTrunks";
import { ErrorType, useNotification } from "@/common/hooks/useNotification";

export default function EditTrunkPage() {
    const router = useRouter();
    const { id } = router.query;
    const { getTrunk } = useTrunks();
    const { notifyError } = useNotification();
    const [initialData, setInitialData] = useState<TrunkFormData | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTrunk = async () => {
            try {
                if (id && typeof id === "string") {
                    const trunk = await getTrunk(id);
                    if (trunk) {
                        // Extract outboundUri from the first URI if available
                        const outboundUri = trunk.uris && trunk.uris.length > 0 ? trunk.uris[0].host : undefined;

                        setInitialData({
                            ref: trunk.ref,
                            name: trunk.name,
                            inboundUri: trunk.inboundUri || "",
                            sendRegister: trunk.sendRegister || false,
                            accessControlListRef: trunk.accessControlListRef,
                            inboundCredentialsRef: trunk.inboundCredentialsRef,
                            outboundCredentialsRef: trunk.outboundCredentialsRef,
                            outboundUri
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