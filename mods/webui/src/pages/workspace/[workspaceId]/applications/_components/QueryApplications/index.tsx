import { useTableContext } from "@/common/components/context-table/useTableContext";
import { Application } from "@fonoster/types";
import { useCallback, useEffect, useState } from "react";
import { useApplications } from "../../_hook/useApplications";

const QueryApplications = () => {
  const { setData, setLoadingData } = useTableContext<Application[]>();
  const [loading, setLoading] = useState(false);

  const { fetch } = useApplications();
  // useEffect(() => {
  //     setData([]);
  // }, [data]);

  useEffect(() => {
    handleFetch();
  }, []);

  const handleFetch = useCallback(async () => {
    setLoadingData(true);
    await fetch();
    setLoadingData(false);
  }, []);

  return null;
};
export default QueryApplications;