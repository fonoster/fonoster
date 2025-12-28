# Fonoster MCP Server

[![Discord](https://img.shields.io/discord/1016419835455996076?color=5865F2&label=Discord&logo=discord&logoColor=white)](https://discord.gg/4QWgSz4hTC) ![GitHub](https://img.shields.io/github/license/fonoster/fonoster?color=%2347b96d) ![Twitter Follow](https://img.shields.io/twitter/follow/fonoster?style=social)

MCP Server for the Fonoster API, enabling MCP clients to interact with Fonoster's telephony services. This module is part of the [Fonoster](https://fonoster.com) open-source project. For more information about the project, please visit [https://github.com/fonoster/fonoster](https://github.com/fonoster/fonoster).

## Tools

1. `list_numbers`
   - Returns a list of numbers from Fonoster in a table format (using markdown)
   - Optional inputs:
     - `page_size` (number): Maximum number of numbers to return
     - `page_token` (string): Pagination token for next page
   - Returns: List of numbers with their refs, names, and telUrls

2. `list_applications`
   - Lists applications from Fonoster in a table format (using markdown)
   - Optional inputs:
     - `page_size` (number): Maximum number of applications to return
     - `page_token` (string): Pagination token for next page
   - Returns: List of applications with their refs, names, endpoints, creation dates, update dates, and types

3. `create_call`
   - Creates a call from Fonoster
   - Required inputs:
     - `from` (string): The number to call from
     - `to` (string): The number to call to
     - `app_ref` (string): The reference to the application to use for the call
     - `metadata` (object): Metadata to be sent to the application
   - Returns: Call creation confirmation with reference ID

4. `create_call_batch`
   - Creates a batch of calls from Fonoster
   - Required inputs:
     - `from` (string): The number to call from
     - `to_array` (array): The numbers to call to
     - `app_ref` (string): The reference to the application to use for the call
     - `metadata` (object): Metadata to be sent to the application
   - Returns: Batch creation confirmation with reference ID

## Prompts

1. `create_call_prompt`
   - A prompt for creating a call step by step
   - Guides an MCP client through the process of:
     - Asking the user for the number or numbers to call if not already provided
     - Offering a list of available numbers using the `list_numbers` tool
     - Asking for the application name and finding its reference
     - Creating a call using the `create_call` or `create_call_batch` tool depending on the user's request

## Setup

### Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

> If you are logged in to the command-line tool, simply run `fonoster mcp:configure --client claude` to configure the server.

#### npx

```json
{
  "mcpServers": {
    "fonoster": {
      "command": "npx",
      "args": [
        "-y",
        "@fonoster/mcp"
      ],
      "env": {
        "MCP_WORKSPACE_ACCESS_KEY_ID": "your-workspace-access-key-id",
        "MCP_APIKEY_ACCESS_KEY_ID": "your-apikey-access-key-id",
        "MCP_APIKEY_ACCESS_KEY_SECRET": "your-apikey-access-key-secret"
      }
    }
  }
}
```

#### docker

```json
{
  "mcpServers": {
    "fonoster": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "MCP_WORKSPACE_ACCESS_KEY_ID",
        "-e",
        "MCP_APIKEY_ACCESS_KEY_ID",
        "-e",
        "MCP_APIKEY_ACCESS_KEY_SECRET",
        "fonoster/mcp"
      ],
      "env": {
        "MCP_WORKSPACE_ACCESS_KEY_ID": "your-workspace-access-key-id",
        "MCP_APIKEY_ACCESS_KEY_ID": "your-apikey-access-key-id",
        "MCP_APIKEY_ACCESS_KEY_SECRET": "your-apikey-access-key-secret"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MCP_WORKSPACE_ACCESS_KEY_ID` | Your workspace access key ID | Yes |
| `MCP_APIKEY_ACCESS_KEY_ID` | Your API key access key ID | Yes |
| `MCP_APIKEY_ACCESS_KEY_SECRET` | Your API key secret | Yes |
| `MCP_ENDPOINT` | Custom API endpoint (e.g., `localhost:50051`) | No |
| `MCP_ALLOW_INSECURE` | Allow insecure connections (`true`/`false`) | No |

### Testing with the MCP Inspector

```bash
MCP_WORKSPACE_ACCESS_KEY_ID="your-workspace-access-key-id" \
MCP_APIKEY_ACCESS_KEY_ID="your-apikey-access-key-id" \
MCP_APIKEY_ACCESS_KEY_SECRET="your-apikey-access-key-secret" \
npx @modelcontextprotocol/inspector \
node /path/to/fonoster/mods/mcp/dist/index.js
```

### Troubleshooting

If you encounter authentication errors, verify that:
1. Your Fonoster credentials are correct
2. The environment variables are properly set
3. You have the necessary permissions to access the Fonoster API

## Build

Docker build:

```bash
docker build -t fonoster/mcp -f Dockerfile .
```
