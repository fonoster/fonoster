import { Meta, StoryObj } from "@storybook/react";
import { ColumnDef } from "@tanstack/react-table";
import PageContainer from "@/common/components/layout/pages";
import { QueryData } from "@stories/table/QueryData";
import { usePaginatedData } from "@/common/hooks/usePaginatedData";
import { useState } from "react";
import { Button } from "@stories/button/Button";
import { Icon } from "@stories/icon/Icon";
import { Typography } from "@stories/typography/Typography";
import React from "react";
import { Stack } from "@mui/material";

// Define the interface for our table data
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
}

// Create a fake data generator function
const generateFakeUser = (index: number): User => ({
  id: `user-${index + 1}`,
  name: `User ${index + 1}`,
  email: `user${index + 1}@example.com`,
  role: index % 3 === 0 ? "Admin" : index % 3 === 1 ? "Editor" : "Viewer",
  status: index % 2 === 0 ? "Active" : "Inactive",
  createdAt: new Date(Date.now() - index * 86400000)
});

// Create a hook for fake user data
const useFakeUsers = () => {
  const { listItems } = usePaginatedData<User>({
    generateFakeData: generateFakeUser,
    totalItems: 50,
    defaultPageSize: 10
  });

  return { listUsers: listItems };
};

// Define the columns for our table
const columns: ColumnDef<User>[] = [
  {
    id: "id",
    header: "ID",
    cell: (props) => props.row.original.id,
  },
  {
    id: "name",
    header: "Name",
    cell: (props) => props.row.original.name,
  },
  {
    id: "email",
    header: "Email",
    cell: (props) => props.row.original.email,
  },
  {
    id: "role",
    header: "Role",
    cell: (props) => props.row.original.role,
  },
  {
    id: "status",
    header: "Status",
    cell: (props) => props.row.original.status,
  },
  {
    id: "createdAt",
    header: "Created At",
    cell: (props) => props.row.original.createdAt.toLocaleDateString(),
  }
];

/**
 * The Table component provides a flexible and feature-rich way to display tabular data in your application.
 * It supports pagination, sorting, filtering, and row selection.
 */
const meta = {
  title: "Table",
  parameters: {
    layout: "fullscreen",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library"
    }
  },
  tags: ["autodocs"]
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic table with default settings.
 */
export const Default: Story = {
  render: () => {
    const { listUsers } = useFakeUsers();
    return (
      <div style={{ padding: "20px" }}>
        <Typography variant="heading-medium" sx={{ mb: 2 }}>Default Table</Typography>
        <Typography variant="body-medium" sx={{ mb: 3 }}>
          A basic table with default settings including search, filters, and pagination.
        </Typography>
        <PageContainer>
          <PageContainer.ContentTable<User>
            columns={columns}
            tableId="default-table"
            showFilters={true}
            showSearch={true}
            showPagination={true}
          >
            <QueryData<User> fetchFunction={listUsers} pageSize={10} />
          </PageContainer.ContentTable>
        </PageContainer>
      </div>
    );
  }
};

/**
 * Table with row selection enabled.
 */
export const WithRowSelection: Story = {
  render: () => {
    const { listUsers } = useFakeUsers();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleRowSelection = (row: User) => {
      setSelectedUser(row);
    };

    return (
      <div style={{ padding: "20px" }}>
        <Typography variant="heading-medium" sx={{ mb: 2 }}>Table with Row Selection</Typography>
        <Typography variant="body-medium" sx={{ mb: 3 }}>
          This table allows selecting rows with a checkbox in the first column.
        </Typography>
        
        {selectedUser && (
          <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
            <Typography variant="body-large">Selected User: {selectedUser.name}</Typography>
            <Typography variant="body-small">ID: {selectedUser.id}</Typography>
            <Typography variant="body-small">Email: {selectedUser.email}</Typography>
          </div>
        )}
        
        <PageContainer>
          <PageContainer.ContentTable<User>
            columns={columns}
            tableId="selectable-table"
            showFilters={true}
            showSearch={true}
            showPagination={true}
            showSelectAll={true}
            onRowSelection={handleRowSelection}
          >
            <QueryData<User> fetchFunction={listUsers} pageSize={10} />
          </PageContainer.ContentTable>
        </PageContainer>
      </div>
    );
  }
};

/**
 * Table with action column for row-specific actions.
 */
export const WithActionColumn: Story = {
  render: () => {
    const { listUsers } = useFakeUsers();
    
    // Define columns with an action column
    const columnsWithActions: ColumnDef<User>[] = [
      ...columns,
      {
        id: "actions",
        header: "Actions",
        cell: (props: { row: { original: User } }) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Icon
              name="Email"
              fontSize="small"
              onClick={() => alert(`Edit user: ${props.row.original.name}`)}
              style={{ cursor: "pointer" }}
            />
            <Icon
              name="Delete"
              fontSize="small"
              onClick={() => alert(`Delete user: ${props.row.original.name}`)}
              style={{ cursor: "pointer" }}
            />
          </Stack>
        )
      }
    ];

    return (
      <div style={{ padding: "20px" }}>
        <Typography variant="heading-medium" sx={{ mb: 2 }}>Table with Action Column</Typography>
        <Typography variant="body-medium" sx={{ mb: 3 }}>
          This table includes an action column with clickable icons for each row.
        </Typography>
        
        <PageContainer>
          <PageContainer.ContentTable<User>
            columns={columnsWithActions}
            tableId="action-table"
            showFilters={true}
            showSearch={true}
            showPagination={true}
          >
            <QueryData<User> fetchFunction={listUsers} pageSize={10} />
          </PageContainer.ContentTable>
        </PageContainer>
      </div>
    );
  }
};

/**
 * Minimal table with limited features.
 */
export const MinimalTable: Story = {
  render: () => {
    const { listUsers } = useFakeUsers();

    return (
      <div style={{ padding: "20px" }}>
        <Typography variant="heading-medium" sx={{ mb: 2 }}>Minimal Table</Typography>
        <Typography variant="body-medium" sx={{ mb: 3 }}>
          A simplified table with fewer columns and minimal controls.
        </Typography>
        
        <PageContainer>
          <PageContainer.ContentTable<User>
            columns={columns.slice(0, 3)} // Only show id, name, and email columns
            tableId="minimal-table"
            showFilters={false}
            showSearch={false}
            showPagination={true}
            showSelectAll={false}
          >
            <QueryData<User> fetchFunction={listUsers} pageSize={5} />
          </PageContainer.ContentTable>
        </PageContainer>
      </div>
    );
  }
};

/**
 * Table with loading state.
 */
export const LoadingTable: Story = {
  render: () => {
    // Create a mock fetch function that never resolves to simulate loading
    const mockFetchFunction = () => new Promise(() => { });

    return (
      <div style={{ padding: "20px" }}>
        <Typography variant="heading-medium" sx={{ mb: 2 }}>Loading Table</Typography>
        <Typography variant="body-medium" sx={{ mb: 3 }}>
          This example shows how the table looks in a loading state.
        </Typography>
        
        <PageContainer>
          <PageContainer.ContentTable<User>
            columns={columns}
            tableId="loading-table"
            showFilters={true}
            showSearch={true}
            showPagination={true}
          >
            <QueryData<User> fetchFunction={mockFetchFunction} pageSize={10} />
          </PageContainer.ContentTable>
        </PageContainer>
      </div>
    );
  }
};

/**
 * Table with header actions and back navigation.
 */
export const WithHeaderActions: Story = {
  render: () => {
    const { listUsers } = useFakeUsers();

    return (
      <div style={{ padding: "20px" }}>
        <Typography variant="heading-medium" sx={{ mb: 2 }}>Table with Header Actions</Typography>
        <Typography variant="body-medium" sx={{ mb: 3 }}>
          This table includes a header with a title, back navigation, and action buttons.
        </Typography>
        
        <PageContainer>
          <PageContainer.Header
            title="Custom Table Configuration"
            backTo={{
              label: "Back to Dashboard",
              onClick: () => console.log("Navigate back")
            }}
            actions={
              <Button
                variant="outlined"
                onClick={() => alert("Create New User")}
                endIcon={<Icon fontSize="small" name="Add" />}
              >
                Create New User
              </Button>
            }
          />
          <PageContainer.Subheader>
            Use this section to manage users and their permissions.
          </PageContainer.Subheader>

          <PageContainer.ContentTable<User>
            columns={columns}
            tableId="header-actions-table"
            showFilters={true}
            showSearch={true}
            showPagination={true}
          >
            <QueryData<User> fetchFunction={listUsers} pageSize={10} />
          </PageContainer.ContentTable>
        </PageContainer>
      </div>
    );
  }
};