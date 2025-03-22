import { useEffect, useState } from "react";
import NumberForm from "./_components/form/NumberForm";

export default function NewNumberPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return <NumberForm isLoading={isLoading} />;
}
