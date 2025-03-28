import { useRouter } from "next/router";
import { ColumnDef } from "@tanstack/react-table";
import PageContainer from "@/common/components/layout/pages";
import { Button } from "@stories/button/Button";
import { useApplications } from "@/common/sdk/hooks/useApplications";
import { Application } from "@fonster/types";
import { Icon } from "@stories/icon/Icon";
import { QueryData } from "@stories/table/QueryData";

const columns: ColumnDef<Application>[] = [
  {
    id: "ref",
    header: "Ref",
    cell: (props: { row: { original: Application } }) => props.row.original.ref
  },
  {
    id: "name",
    header: "Name",
    cell: (props: { row: { original: Application } }) => props.row.original.name
  },
  {
    id: "textToSpeech",
    header: "TTS",
    cell: (props: { row: { original: Application } }) =>
      props.row.original.textToSpeech?.productRef
  },
  {
    id: "speechToText",
    header: "STT",
    cell: (props: { row: { original: Application } }) =>
      props.row.original.speechToText?.productRef
  }
];

export default function ApplicationsPage() {
  const router = useRouter();
  const { workspaceId } = router.query;
  const { listApplications } = useApplications();

  const handleNewApplication = () => {
    router.push(`/workspace/${workspaceId}/applications/new`);
  };

  const handleEdit = (row: Application) => {
    router.push(`/workspace/${workspaceId}/applications/${row.ref}`);
  };

  return (
    <PageContainer>
      <PageContainer.Header
        title="Voice Applications"
        actions={
          <Button
            variant="outlined"
            onClick={() => handleNewApplication()}
            endIcon={<Icon fontSize="small" name="Add" />}
          >
            Create New Application
          </Button>
        }
      />
      <PageContainer.Subheader>
        Use this section to connect your Dialogflow, IBM Watson, and OpenAI
        Assistants with your numbers.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<Application>
        columns={columns}
        tableId="applications"
        showSelectAll={true}
        onRowSelection={handleEdit}
      >
        <QueryData<Application>
          fetchFunction={listApplications}
          pageSize={10}
        />
      </PageContainer.ContentTable>
    </PageContainer>
  );
}
