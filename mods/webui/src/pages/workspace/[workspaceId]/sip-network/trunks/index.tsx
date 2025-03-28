import { ColumnDef } from "@tanstack/react-table";
import PageContainer from "@/common/components/layout/pages";
import { Button } from "@stories/button/Button";

import { QueryData } from "@stories/table/QueryData";
import { useTrunks } from "@/common/sdk/hooks/useTrunks";
import { Trunk } from "@fonoster/types";
import { Icon } from "@stories/icon/Icon";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { useRouter } from "next/router";

const columns: ColumnDef<Trunk>[] = [
  {
    id: "name",
    header: "Name",
    cell: (props: { row: { original: Trunk } }) => props.row.original.name
  },
  {
    id: "sendRegister",
    header: "Send Register",
    cell: (props: { row: { original: Trunk } }) =>
      props.row.original.sendRegister ? "True" : "False"
  },
  {
    id: "inboundUri",
    header: "Inbound SIP",
    cell: (props: { row: { original: Trunk } }) => props.row.original.inboundUri
  },
  {
    id: "outboundCredentialsRef",
    header: "Outbound SIP URI",
    cell: (props: { row: { original: Trunk } }) =>
      props.row.original.outboundCredentialsRef
  }
];

export default function TrunksPage() {
  const { listTrunks } = useTrunks();
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();

  const handleNew = () => {
    router.push(`/workspace/${selectedWorkspace?.ref}/sip-network/trunks/new`);
  };

  const handleEdit = (row: Trunk) => {
    router.push(
      `/workspace/${selectedWorkspace?.ref}/sip-network/trunks/${row.ref}`
    );
  };

  return (
    <PageContainer>
      <PageContainer.Header
        title="Trunks"
        actions={
          <Button
            variant="outlined"
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

      <PageContainer.ContentTable<Trunk>
        columns={columns}
        tableId="trunks-table"
        showSelectAll={true}
        onRowSelection={handleEdit}
      >
        <QueryData<Trunk> fetchFunction={listTrunks} pageSize={10} />
      </PageContainer.ContentTable>
    </PageContainer>
  );
}
