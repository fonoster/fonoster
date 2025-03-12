import { useCallback, useEffect } from "react";

import { MemberDTO } from "@/types/dto/workspace/MemberDTO";
import { useTableContext } from "@/common/contexts/table/useTableContext";
import { useWorkspaces } from "@/common/sdk/hooks/useWorkspaces";

const QueryMembers = () => {
  const { setData, setLoadingData } = useTableContext<MemberDTO>();
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
    console.log("members", members);
    
    // Convert API members to MemberDTO format
    const apiMembers = (members?.items || []).map(member => ({
      ...member,
      createdAt: member.createdAt instanceof Date ? member.createdAt.toISOString() : String(member.createdAt),
      updatedAt: member.updatedAt instanceof Date ? member.updatedAt.toISOString() : String(member.updatedAt)
    }));
    
    // Create dummy members
    const dummyMembers = Array.from({ length: 5 }).map((_, i) => ({
      ref: `member-${i}`,
      name: `Member ${i}`,
      email: `member${i}@example.com`,
      role: "MEMBER",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    // Combine both arrays
    setData([...apiMembers, ...dummyMembers]);
    setLoadingData(false);
  }, []);

  return null;
};
export default QueryMembers;
