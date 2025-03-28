import PageContainer from "@/common/components/layout/pages";
import { Agent } from "@fonoster/types";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@stories/button/Button";
import { Icon } from "@stories/icon/Icon";
import { QueryData } from "@stories/table/QueryData";
import { usePaginatedData } from "@/common/hooks/usePaginatedData";

const columns: ColumnDef<Agent>[] = [
  {
    id: "name",
    header: "Name",
    cell: (props: { row: { original: any } }) => props.row.original.name
  },
  {
    id: "size",
    header: "Size",
    cell: (props: { row: { original: any } }) => props.row.original.size
  },
  {
    id: "fileType",
    header: "File Type",
    cell: (props: { row: { original: any } }) => props.row.original.fileType
  },
  {
    id: "lastModified",
    header: "Last Modified",
    cell: (props: { row: { original: any } }) => props.row.original.lastModified
  },
  {
    id: "info",
    header: "Info",
    cell: (props: { row: { original: any } }) => (
      <Icon fontSize="small" name="Info" />
    )
  }
];

export default function StoragePage() {
  // Handle Fake data - make sure all required Domain properties are non-optional
  const { listItems } = usePaginatedData<any>({
    generateFakeData: (index: number) => ({
      ref: `domain-${index}`,
      name: `Domain ${index + 1}`, // This is required to be non-optional
      size: `123-${index}MB`,
      fileType: `Audio/WAV`,
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
        title="Storage"
        actions={
          <Button
            variant="contained"
            onClick={() => {}}
            endIcon={<Icon fontSize="small" name="Upload" />}
          >
            Upload New File
          </Button>
        }
      />
      <PageContainer.Subheader>
        Here is where your recordings and play files live.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<any>
        columns={columns}
        tableId="storage-table"
        showSelectAll={true}
        options={{
          enableRowSelection: true
        }}
      >
        <QueryData<any> fetchFunction={listItems} pageSize={10} />
      </PageContainer.ContentTable>
    </PageContainer>
  );
}
