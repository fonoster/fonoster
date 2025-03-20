import { ColumnDef } from "@tanstack/react-table";
import PageContainer from "@/common/components/layout/pages";
import { Button } from "@stories/button/Button";

import { QueryData } from "@/common/contexts/table/QueryData";
import { useTrunks } from "@/common/sdk/hooks/useTrunks";
import { ListTrunksResponse } from "@fonoster/types";
import { Icon } from "@stories/icon/Icon";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { useRouter } from "next/router";

const columns: ColumnDef<ListTrunksResponse>[] = [
  {
    id: "name",
    header: "Name",
    cell: (props: { row: { original: ListTrunksResponse } }) =>
      props.row.original.name
  },
  {
    id: "sendRegister",
    header: "Send Register",
    cell: (props: { row: { original: ListTrunksResponse } }) =>
      props.row.original.sendRegister ? "True" : "False"
  },
  {
    id: "inboundUri",
    header: "Inbound SIP",
    cell: (props: { row: { original: ListTrunksResponse } }) =>
      props.row.original.inboundUri
  },
  {
    id: "outboundUri",
    header: "Outbound SIP URI",
    cell: (props: { row: { original: ListTrunksResponse } }) =>
      props.row.original.outboundUri
  }
];

export default function TrunksPage() {
  const { listTrunks } = useTrunks();
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();

  const handleNew = () => {
    router.push(`/workspace/${selectedWorkspace?.ref}/sip-network/trunks/new`);
  };

  return (
    <PageContainer>
      <PageContainer.Header
        title="Trunks"
        actions={
          <Button
            variant="contained"
            onClick={handleNew}
            endIcon={<Icon fontSize="small" name="Add" />}
          >
            Create New SIP Trunk
          </Button>
        }
      />
      <PageContainer.Subheader>
        Use this section to configure your VoIP Providers for inbound and
        outbound calls to the PSTN.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<ListTrunksResponse>
        columns={columns}
        tableId="trunks-table"
        options={{
          enableRowSelection: true
        }}
      >
        <QueryData<ListTrunksResponse>
          fetchFunction={listTrunks}
          pageSize={10}
        />
      </PageContainer.ContentTable>
    </PageContainer>
  );
}
