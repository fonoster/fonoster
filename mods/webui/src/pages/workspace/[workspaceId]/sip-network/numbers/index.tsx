import PageContainer from "@/common/components/layout/pages";
import { Button, CircularProgress, Box } from "@mui/material";
import { useRouter } from "next/router";
import { INumberExtended } from "@fonoster/types";
import { ColumnDef } from "@tanstack/react-table";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { useNumbers } from "@/common/sdk/hooks/useNumbers";
import { useEffect, useState } from "react";

const columns: ColumnDef<INumberExtended>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "telUrl",
    header: "Tel URL",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "city",
    header: "City",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "country",
    header: "Country",
    cell: (info: any) => info.getValue()
  },
  {
    accessorKey: "trunk",
    header: "Trunk",
    cell: (info: any) => info.getValue()?.name || "-"
  }
];

export default function NumbersPage() {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { listNumbers } = useNumbers();
  const [numbers, setNumbers] = useState<INumberExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNumbers = async () => {
      try {
        const response = await listNumbers();
        if (response && response.items) {
          setNumbers(response.items);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching numbers:", error);
        setIsLoading(false);
      }
    };

    fetchNumbers();
  }, []);

  const handleNew = () => {
    router.push(`/workspace/${selectedWorkspace?.ref}/sip-network/numbers/new`);
  };

  const handleRowClick = (number: INumberExtended) => {
    router.push(
      `/workspace/${selectedWorkspace?.ref}/sip-network/numbers/${number.ref}`
    );
  };

  return (
    <PageContainer>
      <PageContainer.Header
        title="Numbers"
        actions={
          <Button variant="contained" onClick={handleNew}>
            New Number
          </Button>
        }
      />
      <PageContainer.Subheader>
        Manage your phone numbers and their configurations.
      </PageContainer.Subheader>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <PageContainer.ContentTable<INumberExtended>
          columns={columns}
          tableId="numbers-table"
        />
      )}
    </PageContainer>
  );
}
