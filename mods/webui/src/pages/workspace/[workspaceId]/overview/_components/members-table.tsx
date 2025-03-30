import PageContainer from "@/common/components/layout/pages";
import { ColumnDef } from "@tanstack/react-table";
import { Icon } from "@stories/icon/Icon";
import { QueryData } from "@stories/table/QueryData";
import { useWorkspaces } from "@/common/sdk/hooks/useWorkspaces";
import { WorkspaceMemberDTO } from "@/types/dto/workspace/WorkspaceMemberDTO";
import { formatToShortDate } from "@/utils/dayjs";
import { Stack } from "@mui/material";

const columns = (
  onDelete: (data: WorkspaceMemberDTO) => void,
  onSendEmail: (data: WorkspaceMemberDTO) => void
): ColumnDef<WorkspaceMemberDTO>[] => {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: "NAME",
      cell: (props: { row: { original: WorkspaceMemberDTO } }) =>
        props.row.original.name
    },
    {
      id: "email",
      accessorKey: "email",
      header: "EMAIL",
      cell: (props: { row: { original: WorkspaceMemberDTO } }) =>
        props.row.original.email
    },
    {
      id: "role",
      header: "ROLE",
      cell: (props: { row: { original: WorkspaceMemberDTO } }) =>
        props.row.original.role
    },
    {
      id: "dateAdded",
      header: "DATE ADDED",
      cell: (props: { row: { original: WorkspaceMemberDTO } }) =>
        formatToShortDate(props.row.original.createdAt)
    },
    {
      id: "status",
      header: "STATUS",
      cell: (props: { row: { original: WorkspaceMemberDTO } }) =>
        props.row.original.status
    },
    {
      id: "actions",
      header: "Actions",
      cell: (props: { row: { original: WorkspaceMemberDTO } }) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Icon
            name="Email"
            fontSize="small"
            onClick={() => onSendEmail(props.row.original)}
            style={{ cursor: "pointer" }}
          />
          <Icon
            name="Delete"
            fontSize="small"
            onClick={() => onDelete(props.row.original)}
            style={{ cursor: "pointer" }}
          />
        </Stack>
      )
    }
  ];
};

export default function MembersTable({
  onDelete,
  onSendEmail
}: {
  onDelete: (data: WorkspaceMemberDTO) => void;
  onSendEmail: (data: WorkspaceMemberDTO) => void;
}) {
  const { listWorkspaceMembers } = useWorkspaces();

  const columnsList = columns(onDelete, onSendEmail);

  return (
    <PageContainer.ContentTable<WorkspaceMemberDTO>
      columns={columnsList}
      tableId="members-table"
      // showSelectAll={true}
    >
      <QueryData<WorkspaceMemberDTO>
        fetchFunction={listWorkspaceMembers}
        pageSize={10}
      />
    </PageContainer.ContentTable>
  );
}
