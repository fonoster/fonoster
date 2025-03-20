import { useRouter } from "next/router";
import { ColumnDef } from "@tanstack/react-table";
import PageContainer from "@/common/components/layout/pages";
import { Button } from "@stories/button/Button";
import { useApplications } from "@/common/sdk/hooks/useApplications";
import { QueryData } from "@/common/contexts/table/QueryData";
import { Application } from "@fonster/types";

const columns: ColumnDef<Application>[] = [
  {
    id: "ref",
    header: "Ref",
    cell: (props: { row: { original: Application } }) =>
      props.row.original.ref
  },
  {
    id: "name",
    header: "Name",
    cell: (props: { row: { original: Application } }) =>
      props.row.original.name
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

  return (
    <PageContainer>
      <PageContainer.Header
        title="Applications"
        actions={
          <Button variant="outlined" onClick={() => handleNewApplication()}>
            New Application
          </Button>
        }
      />
      <PageContainer.Subheader>
        Manage all your Fonoster applications here. Create, edit and monitor
        your applications in execution.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<Application>
        columns={columns}
        tableId="applications-table"
      >
        <QueryData<Application>
          fetchFunction={listApplications}
          pageSize={10}
        />
      </PageContainer.ContentTable>
    </PageContainer>
  );
}
