import PageContainer from "@/common/components/layout/pages";
import { useRouter } from "next/router";
import { INumber } from "@fonoster/types";
import { ColumnDef } from "@tanstack/react-table";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { useNumbers } from "@/common/sdk/hooks/useNumbers";
import { Icon } from "@stories/icon/Icon";
import { QueryData } from "@stories/table/QueryData";
import { Button } from "@stories/button/Button";

const columns: ColumnDef<INumber>[] = [
  {
    id: "name",
    header: "Name",
    cell: (props: { row: { original: INumber } }) => props.row.original.name
  },
  {
    id: "telUrl",
    header: "Tel URL",
    cell: (props: { row: { original: INumber } }) => props.row.original.telUrl
  },
  {
    id: "city",
    header: "Address",
    cell: (props: { row: { original: INumber } }) =>
      `${props.row.original.city}, ${props.row.original.countryIsoCode}, ${props.row.original.country}`
  },
  {
    id: "agentAor",
    header: "Agent AOR",
    cell: (props: { row: { original: INumber } }) => props.row.original.agentAor
  },
  {
    id: "appRef",
    header: "Application",
    cell: (props: { row: { original: INumber } }) => props.row.original.appRef
  }
];

export default function NumbersPage() {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { listNumbers } = useNumbers();

  const handleNew = () => {
    router.push(`/workspace/${selectedWorkspace?.ref}/sip-network/numbers/new`);
  };

  const handleRowClick = (number: INumber) => {
    router.push(
      `/workspace/${selectedWorkspace?.ref}/sip-network/numbers/${number.ref}`
    );
  };

  return (
    <PageContainer>
      <PageContainer.Header
        title="Numbers"
        actions={
          <Button
            variant="outlined"
            onClick={handleNew}
            endIcon={<Icon fontSize="small" name="Add" />}
          >
            Create New Number
          </Button>
        }
      />
      <PageContainer.Subheader>
        You will need a Number to make and receive calls from the PSTN
        (traditional phones).
      </PageContainer.Subheader>

      <PageContainer.ContentTable<INumber>
        columns={columns}
        tableId="numbers-table"
        showSelectAll={true}
      >
        <QueryData<INumber> fetchFunction={listNumbers} pageSize={10} />
      </PageContainer.ContentTable>
    </PageContainer>
  );
}
