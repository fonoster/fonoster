import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import NumberForm from "./_components/form/NumberForm";
import { NumberFormData } from "./_components/form/NumberForm";
import { useNumbers } from "@/common/sdk/hooks/useNumbers";
import { ErrorType, useNotification } from "@/common/hooks/useNotification";

export default function EditNumberPage() {
  const router = useRouter();
  const { id } = router.query;
  const { getNumber } = useNumbers();
  const { notifyError } = useNotification();
  const [initialData, setInitialData] = useState<NumberFormData | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNumber = async () => {
      try {
        if (id && typeof id === "string") {
          const number = await getNumber(id);
          if (number) {
            setInitialData({
              ref: number.ref,
              name: number.name,
              telUrl: number.telUrl,
              city: number.city,
              country: number.country,
              countryIsoCode: number.countryIsoCode,
              trunkRef: number.trunk?.ref,
              appRef: number.appRef,
              agentAor: number.agentAor
            });
          }
        }
      } catch (error: any) {
        notifyError(error as ErrorType);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNumber();
  }, [id]);

  return (
    <NumberForm
      initialData={initialData}
      numberId={id as string}
      isLoading={isLoading}
    />
  );
}
