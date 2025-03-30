import PageContainer from "@/common/components/layout/pages";
import { Secret } from "@fonoster/types";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { useSecret } from "@/common/sdk/hooks/useSecret";
import { QueryData } from "@stories/table/QueryData";
import { Icon } from "@stories/icon/Icon";
import { Button } from "@stories/button/Button";

const columns: ColumnDef<Secret>[] = [
  {
    id: "name",
    header: "Name",
    cell: (props: { row: { original: Secret } }) => props.row.original.name
  }
];

export default function SecretsPage() {
  const router = useRouter();
  const { selectedWorkspace } = useWorkspaceContext();
  const { listSecrets } = useSecret();

  return (
    <PageContainer>
      <PageContainer.Header
        title="Secrets"
        actions={
          <Button
            variant="contained"
            onClick={() =>
              router.push(`/workspace/${selectedWorkspace?.ref}/secrets/new`)
            }
            endIcon={<Icon fontSize="small" name="Add" />}
          >
            Create New Secret
          </Button>
        }
      />
      <PageContainer.Subheader>
        Safeguard your credentials in the Secrets Vault. Secrets are encrypted
        variables that you can use in your Voice Applications and APIs. Secrets
        are only available for use within the project.
      </PageContainer.Subheader>

      <PageContainer.ContentTable<Secret>
        columns={columns}
        tableId="secrets-table"
        showSelectAll={true}
        options={{
          enableRowSelection: true
        }}
      >
        <QueryData<Secret> fetchFunction={listSecrets} pageSize={10} />
      </PageContainer.ContentTable>
    </PageContainer>
  );
}
