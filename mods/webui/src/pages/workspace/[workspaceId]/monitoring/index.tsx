import PageContainer from "@/common/components/layout/pages";
import {
  CallDetailRecord,
  CallStatus,
  CallDirection,
  CallType
} from "@fonoster/types";
import { ColumnDef } from "@tanstack/react-table";
import { QueryData } from "@stories/table/QueryData";
import { usePaginatedData } from "@/common/hooks/usePaginatedData";
import { Button } from "@stories/button/Button";

const columns: ColumnDef<CallDetailRecord>[] = [
  {
    id: "ref",
    header: "Call Ref",
    cell: (info: { row: { original: CallDetailRecord } }) =>
      info.row.original.ref
  },
  {
    id: "status",
    header: "Status",
    cell: (info: { row: { original: CallDetailRecord } }) =>
      info.row.original.status
  },
  {
    id: "direction",
    header: "Direction",
    cell: (info: { row: { original: CallDetailRecord } }) =>
      info.row.original.direction
  },
  {
    id: "from",
    header: "From",
    cell: (info: { row: { original: CallDetailRecord } }) =>
      info.row.original.from
  },
  {
    id: "to",
    header: "To",
    cell: (info: { row: { original: CallDetailRecord } }) =>
      info.row.original.to
  },
  {
    id: "callType",
    header: "Call Type",
    cell: (info: { row: { original: CallDetailRecord } }) =>
      info.row.original.type
  },
  {
    id: "duration",
    header: "Duration",
    cell: (info: { row: { original: CallDetailRecord } }) =>
      `${info.row.original.duration} s`
  }
];

export default function MonitoringPage() {
  // Handle Fake data - make sure all required Domain properties are non-optional
  const { listItems } = usePaginatedData<CallDetailRecord>({
    generateFakeData: (index: number) => ({
      ref: `domain-${index}`,
      accessKeyId: `accessKeyId-${index}`,
      name: `Domain ${index + 1}`, // This is required to be non-optional
      status:
        index % 2 === 0
          ? CallStatus.CALL_REJECTED
          : CallStatus.INVALID_NUMBER_FORMAT,
      direction:
        index % 2 === 0 ? CallDirection.FROM_PSTN : CallDirection.INTRA_NETWORK,
      from: `+1234567890${index}`,
      to: `+0987654321${index}`,
      type: index % 2 === 0 ? CallType.SIP_ORIGINATED : CallType.API_ORIGINATED,
      duration: index * 60,
      startedAt: new Date(Date.now() - index * 86400000),
      endedAt: new Date(Date.now() - index * 86400000),
      lastModified: new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      }).format(new Date(Date.now() - index * 86400000)),
      createdAt: new Date(Date.now() - index * 86400000),
      updatedAt: new Date(Date.now() - index * 43200000)
    }),
    totalItems: 30,
    defaultPageSize: 10
  });

  return (
    <PageContainer>
      <PageContainer.Header
        title="Monitoring / Call Logs"
        actions={
          <Button variant="outlined" onClick={() => {}}>
            Export CSV
          </Button>
        }
      />
      <PageContainer.Subheader>
        View and inspect call logs generated within your workspace.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<CallDetailRecord>
        columns={columns}
        tableId="call-detail-records-table"
        showSelectAll={true}
      >
        <QueryData<CallDetailRecord> fetchFunction={listItems} pageSize={10} />
      </PageContainer.ContentTable>
    </PageContainer>
  );
}
