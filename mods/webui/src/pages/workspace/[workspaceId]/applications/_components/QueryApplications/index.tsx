import { useCallback, useEffect, useState } from "react";
import { useApplications } from "../../_hooks/useApplications";
import { ApplicationDTO } from "@/types/dto/applications/ApplicationDTO";
import { useTableContext } from "@/common/contexts/table/useTableContext";

const QueryApplications = () => {
  const { setData, setLoadingData, data } = useTableContext<ApplicationDTO>();
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
    console.log("handleFetch");
    setData([
      {
        ref: "1",
        name: "Aplicación 1",
        projectId: "project-123",
        tts: "enabled",
        stt: "enabled",
        intelligence: {
          productRef: "intell-123",
          config: {
            key1: "value1",
            key2: "value2"
          }
        }
      },
      {
        ref: "2",
        name: "Aplicación 2",
        projectId: "project-456",
        tts: "disabled",
        stt: "disabled",
        intelligence: {
          productRef: "intell-456",
          config: {
            key1: "value1",
            key2: "value2"
          }
        }
      }
    ]);
    setLoadingData(false);
  }, []);

  return null;
};
export default QueryApplications;
