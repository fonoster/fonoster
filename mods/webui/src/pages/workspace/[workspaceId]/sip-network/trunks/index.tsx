import { ColumnDef } from "@tanstack/react-table";
import PageContainer from "@/common/components/layout/pages";
import { Button, Box, Typography } from "@mui/material";
import { QueryData } from "@/common/contexts/table/QueryData";
import { useTrunks } from "@/common/sdk/hooks/useTrunks";
import { ListTrunksResponse } from "@fonster/types";
import { useTableContext } from "@/common/contexts/table/useTableContext";

const columns: ColumnDef<ListTrunksResponse>[] = [
  {
    id: "name",
    header: "Name",
    cell: (props: { row: { original: ListTrunksResponse } }) => props.row.original.name
  },
  {
    id: "sendRegister",
    header: "Send Register",
    cell: (props: { row: { original: ListTrunksResponse } }) =>
      props.row.original.sendRegister ? "True" : "False"
  },
  {
    id: "inboundUri",
    header: "Inbound SIP",
    cell: (props: { row: { original: ListTrunksResponse } }) =>
      props.row.original.inboundUri
  },
  {
    id: "outboundUri",
    header: "Outbound SIP URI",
    cell: (props: { row: { original: ListTrunksResponse } }) =>
      props.row.original.outboundUri
  }
];

export default function TrunksPage() {
  const { listTrunks } = useTrunks();

  return (
    <PageContainer>
      <PageContainer.Header
        title="Trunks"
        actions={
          <Button variant="contained" onClick={() => { }}>
            New Trunk
          </Button>
        }
      />
      <PageContainer.Subheader>
        Configure and manage your SIP trunks. Monitor trunk status and
        performance.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<ListTrunksResponse>
        columns={columns}
        tableId="trunks-table"
        options={{
          enableRowSelection: true
        }}
      >
        <QueryData<ListTrunksResponse> fetchFunction={listTrunks} pageSize={10} />
        <SelectedRowsInfo />
      </PageContainer.ContentTable>
    </PageContainer>
  );
}

// Componente para mostrar información sobre las filas seleccionadas
function SelectedRowsInfo() {
  const { rowSelection, getSelectedRowModel } = useTableContext<ListTrunksResponse>();
  
  const selectedRows = getSelectedRowModel().rows;
  
  return (
    <Box mt={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
      <Typography variant="body2">
        {Object.keys(rowSelection).length} trunks seleccionados
      </Typography>
      {selectedRows.length > 0 && (
        <Box mt={1}>
          <Typography variant="caption">
            Trunks seleccionados: {selectedRows.map(row => row.original.name).join(', ')}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
