import { useCallback, useEffect, useState } from "react";
import { useTableContext } from "@/common/contexts/table/useTableContext";
import { useTrunks } from "@/common/sdk/hooks/useTrunks";
import { TrunkDTO } from "@/types/dto";

const QueryTrunks = () => {
    const { setLoadingData, setCursorResponse, nextPageCursor } = useTableContext<TrunkDTO>();
    const { listTrunks } = useTrunks();

    useEffect(() => {
        handleFetch(nextPageCursor || undefined);
    }, [nextPageCursor]);

    const handleFetch = useCallback(async (pageToken: string | undefined) => {
        setLoadingData(true);
        const response = await listTrunks({
            pageToken
        });
        setCursorResponse(response);
        setLoadingData(false);
    }, []);

    return null;
};
export default QueryTrunks;