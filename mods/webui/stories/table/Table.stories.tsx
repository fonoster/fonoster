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

// Create a TableStory component that accepts props
const TableStory = ({
  showFilters = true,
  showSearch = true,
  showPagination = true,
  showSelectAll = false,
  pageSize = 10,
  enableRowSelection = false
}) => {
  const { listUsers } = useFakeUsers();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleRowSelection = (row: User) => {
    setSelectedUser(row);
    console.log("Selected user:", row);
  };

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="heading-medium" sx={{ mb: 2 }}>Table Component</Typography>
      <Typography variant="body-medium" sx={{ mb: 3 }}>
        A configurable table with various features that can be enabled or disabled.
      </Typography>
      
      {selectedUser && enableRowSelection && (
        <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
          <Typography variant="body-large">Selected User: {selectedUser.name}</Typography>
          <Typography variant="body-small">ID: {selectedUser.id}</Typography>
          <Typography variant="body-small">Email: {selectedUser.email}</Typography>
        </div>
      )}

      <PageContainer>
        <PageContainer.ContentTable<User>
          columns={columns}
          tableId="configurable-table"
          showFilters={showFilters}
          showSearch={showSearch}
          showPagination={showPagination}
          showSelectAll={showSelectAll}
          onRowSelection={handleRowSelection}
        >
          <QueryData<User> fetchFunction={listUsers} pageSize={pageSize} />
        </PageContainer.ContentTable>
      </PageContainer>
    </div>
  );
};

/**
 * The Table component provides a flexible and feature-rich way to display tabular data in your application.
 * It supports pagination, sorting, filtering, and row selection.
 */
const meta = {
  title: "Table",
  component: TableStory,
  parameters: {
    layout: "fullscreen",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library"
    }
  },
  tags: ["autodocs"],
  argTypes: {
    showFilters: {
      name: "Show Filters",
      description: "Show filter controls in the table header",
      control: "boolean",
      defaultValue: true
    },
    showSearch: {
      name: "Show Search",
      description: "Show search input in the table header",
      control: "boolean",
      defaultValue: true
    },
    showPagination: {
      name: "Show Pagination",
      description: "Show pagination controls in the table header",
      control: "boolean",
      defaultValue: true
    },
    showSelectAll: {
      name: "Show Select All",
      description: "Show select all checkbox in the table header",
      control: "boolean",
      defaultValue: false
    },
    pageSize: {
      name: "Page Size",
      description: "Number of items per page",
      control: { type: "number", min: 1, max: 50, step: 1 },
      defaultValue: 10
    },
    enableRowSelection: {
      name: "Enable Row Selection",
      description: "Enable row selection in the table",
      control: "boolean",
      defaultValue: false
    }
  }
} satisfies Meta<typeof TableStory>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic table with default settings.
 */
export const Default: Story = {
  args: {
    showFilters: true,
    showSearch: true,
    showPagination: true,
    showSelectAll: false,
    pageSize: 10,
    enableRowSelection: false
  }
};

/**
 * Table with row selection enabled.
 */
export const WithRowSelection: Story = {
  args: {
    showFilters: true,
    showSearch: true,
    showPagination: true,
    showSelectAll: true,
    pageSize: 10,
    enableRowSelection: true
  }
};

/**
 * Table with minimal configuration.
 */
export const MinimalTable: Story = {
  args: {
    showFilters: false,
    showSearch: false,
    showPagination: true,
    showSelectAll: false,
    pageSize: 5,
    enableRowSelection: false
  }
};

/**
 * Table with action column for row-specific actions.
 */
export const WithActionColumn = () => {
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
};

/**
 * Table with loading state.
 */
export const LoadingTable = () => {
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
};

/**
 * Table with header actions and back navigation.
 */
export const WithHeaderActions = () => {
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
};