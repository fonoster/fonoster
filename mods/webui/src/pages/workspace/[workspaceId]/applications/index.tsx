import { useRouter } from "next/router";
import { ColumnDef } from "@tanstack/react-table";
import PageContainer from "@/common/components/layout/pages";
import { Button } from "@stories/button/Button";
import { useApplications } from "@/common/sdk/hooks/useApplications";
import { QueryData } from "@/common/contexts/table/QueryData";
import { ListApplicationsResponse } from "@fonster/types";
import { Stack } from "@mui/material";
import { Icon } from "@stories/icon/Icon";

const columns: ColumnDef<ListApplicationsResponse>[] = [
  {
    id: "ref",
    header: "Ref",
    cell: (props: { row: { original: ListApplicationsResponse } }) =>
      props.row.original.ref
  },
  {
    id: "name",
    header: "Name",
    cell: (props: { row: { original: ListApplicationsResponse } }) =>
      props.row.original.name
  },
  {
    id: "projectId",
    header: "Project ID",
    cell: (props: { row: { original: ListApplicationsResponse } }) =>
      props.row.original.projectId
  },
  {
    id: "tts",
    header: "TTS",
    cell: (props: { row: { original: ListApplicationsResponse } }) =>
      props.row.original.tts
  },
  {
    id: "stt",
    header: "STT",
    cell: (props: { row: { original: ListApplicationsResponse } }) =>
      props.row.original.stt
  },
  {
    id: "intelligence",
    header: "Inteligence",
    cell: (props: { row: { original: ListApplicationsResponse } }) =>
      props.row.original.intelligence?.productRef
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

      <PageContainer.ContentTable<ListApplicationsResponse>
        columns={columns}
        tableId="applications-table"
      >
        <QueryData<ListApplicationsResponse>
          fetchFunction={listApplications}
          pageSize={10}
        />
      </PageContainer.ContentTable>
    </PageContainer>
  );
}
