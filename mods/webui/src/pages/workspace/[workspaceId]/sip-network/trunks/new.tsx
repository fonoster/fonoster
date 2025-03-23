import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import TrunkForm from "./_components/form/TrunkForm";
import { TrunkFormData } from "./_components/form/TrunkForm";

export default function NewTrunkPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return <TrunkForm isLoading={isLoading} />;
}
