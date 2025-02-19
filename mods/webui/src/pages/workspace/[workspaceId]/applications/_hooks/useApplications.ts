import {useApplications as useSDKApplications } from '@/common/sdk/hooks/useApplications'
import { useState } from 'react';

export const useApplications = () => {
  const sdkApplications = useSDKApplications();
  const [fetching, setFetching] = useState(false);

  const fetch = async () => {
    setFetching(true);
    const response = await sdkApplications.listApplications({});
    console.log(response);
    setFetching(false);
  };
  return { sdkApplications, fetch, fetching };
}