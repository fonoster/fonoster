import { useRouter } from "next/router";
import { ColumnDef } from "@tanstack/react-table";
import PageContainer from "@/common/components/layout/pages";;
import QueryApplications from "./_components/QueryApplications";
import { ApplicationDTO } from "@/types/dto/applications/ApplicationDTO";
import { Button } from "@stories/button/Button";


const columns: ColumnDef<ApplicationDTO>[] = [
  {
    id: "ref",
    header: "Ref",
    cell: (props: { row: { original: ApplicationDTO } }) =>
      props.row.original.ref
  },
  {
    id: "name",
    header: "Name",
    cell: (props: { row: { original: ApplicationDTO } }) =>
      props.row.original.name
  },
  {
    id: "projectId",
    header: "Project ID",
    cell: (props: { row: { original: ApplicationDTO } }) =>
      props.row.original.projectId
  },
  {
    id: "tts",
    header: "TTS",
    cell: (props: { row: { original: ApplicationDTO } }) =>
      props.row.original.tts
  },
  {
    id: "stt",
    header: "STT",
    cell: (props: { row: { original: ApplicationDTO } }) =>
      props.row.original.stt
  },
  {
    id: "intelligence",
    header: "Inteligence",
    cell: (props: { row: { original: ApplicationDTO } }) =>
      props.row.original.intelligence?.productRef
  },
  {
    id: "actions",
    header: "Actions"
  }
];

export default function ApplicationsPage() {
  const router = useRouter();
  const { workspaceId } = router.query;

  const handleNewApplication = () => {
    router.push(`/workspace/${workspaceId}/applications/new`);
  };

  return (
    <PageContainer>
      <PageContainer.Header
        title="Applications"
        actions={
          <Button variant="outlined" onClick={() => handleNewApplication()} >
            New Application
          </Button>
        }
      />
      <PageContainer.Subheader>
        Manage all your Fonoster applications here. Create, edit and monitor
        your applications in execution.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<ApplicationDTO>
        columns={columns}
        tableId="applications-table"
      >
        <QueryApplications />
      </PageContainer.ContentTable>
    </PageContainer>
  );
}
