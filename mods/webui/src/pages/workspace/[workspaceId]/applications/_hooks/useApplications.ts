import { useApplications as useSDKApplications } from "@/common/sdk/hooks/useApplications";
import { useState } from "react";
import { Application } from "@fonoster/types";

export const useApplications = () => {
  const sdkApplications = useSDKApplications();
  const [fetching, setFetching] = useState(false);
  const [items, setItems] = useState<Application[]>([]);

  const fetch = async () => {
    setFetching(true);
    const response = await sdkApplications.listApplications({});
    const items = response?.items || [];
    setItems(items);
    setFetching(false);
  };
  return { sdkApplications, fetch, fetching, items };
};
