import { useCallback, useEffect } from "react";

import { MemberDTO } from "@/types/dto/workspace/MemberDTO";
import { useTableContext } from "@/common/contexts/table/useTableContext";
import { useWorkspaces } from "@/common/sdk/hooks/useWorkspaces";

const QueryMembers = () => {
    const { setData, setLoadingData, data } = useTableContext<MemberDTO>();
    const { listWorkspaceMembers } = useWorkspaces();

    useEffect(() => {
        handleFetch();
    }, []);

    const handleFetch = useCallback(async () => {
        setLoadingData(true);
        const members = await listWorkspaceMembers({
            pageSize: 10,
            pageToken: ""
        });
        console.log('members', members);
        setData(members);
        setLoadingData(false);
    }, []);

    return null;
};
export default QueryMembers;