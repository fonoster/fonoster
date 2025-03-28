import { ColumnDef } from "@tanstack/react-table";
import { Domain } from "@fonoster/types";
import PageContainer from "@/common/components/layout/pages";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { useRouter } from "next/router";
import { Icon } from "@stories/icon/Icon";
import { QueryData } from "@stories/table/QueryData";
import { useDomains } from "@/common/sdk/hooks/useDomains";
import { Button } from "@stories/button/Button";

const columns: ColumnDef<Domain>[] = [
  {
    id: "name",
    header: "Name",
    cell: (props: { row: { original: Domain } }) => props.row.original.name
  },
  {
    id: "domainUri",
    header: "Domain URI",
    cell: (props: { row: { original: Domain } }) => props.row.original.domainUri
  },
  {
    id: "egressRules",
    header: "Egress Rules",
    cell: (props: { row: { original: any } }) => props.row.original.egressRules
  }
];

export default function DomainsPage() {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();

  const { listDomains } = useDomains();

  const handleNew = () => {
    router.push(`/workspace/${selectedWorkspace?.ref}/sip-network/domains/new`);
  };

  return (
    <PageContainer>
      <PageContainer.Header
        title="Domains"
        actions={
          <Button
            variant="outlined"
            onClick={handleNew}
            endIcon={<Icon fontSize="small" name="Add" />}
          >
            New Domain
          </Button>
        }
      />
      <PageContainer.Subheader>
        Configure and manage your SIP domains and related settings.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<Domain>
        columns={columns}
        tableId="domains-table"
        showSelectAll={true}
      >
        <QueryData<Domain> fetchFunction={listDomains} pageSize={10} />
      </PageContainer.ContentTable>
    </PageContainer>
  );
}
