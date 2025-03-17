import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ApplicationForm from "./_components/form/ApplicationForm";
import { ApplicationType } from "@fonoster/types";

export default function NewApplicationPage() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading for demonstration purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return <ApplicationForm isLoading={isLoading} />;
}
