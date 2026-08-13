#!/usr/bin/env node
// Fonoster MCP server (MCP JSON-RPC 2.0 over HTTP) — wraps the Fonoster gRPC SDK.
//
// Fonoster has no REST API, so this uses @fonoster/sdk over gRPC to the in-cluster
// apiserver. Per-request auth: the caller passes their Fonoster credentials as
//   Authorization: Bearer <accessKeyId>:<apiKey>:<apiSecret>
// so one deployment serves every workspace/tenant; nothing is baked in.
import http from 'node:http';
import * as SDK from '@fonoster/sdk';

const PORT = Number(process.env.PORT || 3030);
const ENDPOINT = process.env.FONOSTER_ENDPOINT || 'fonoster-apiserver:50051';
const ALLOW_INSECURE = (process.env.FONOSTER_ALLOW_INSECURE || 'true') === 'true';
const PROTOCOL_VERSION = '2024-11-05';
const SERVER = { name: 'fonoster-mcp', version: '0.1.0' };

const send = (res, status, body) => {
  const data = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) });
  res.end(data);
};
const rpcResult = (id, result) => ({ jsonrpc: '2.0', id, result });
const rpcError = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

// Build + authenticate an SDK client from the caller's Bearer credentials.
async function makeClient(token) {
  if (!token) throw new Error('missing credentials (Authorization: Bearer <accessKeyId>:<apiKey>:<apiSecret>)');
  const [accessKeyId, apiKey, apiSecret] = token.split(':');
  if (!accessKeyId || !apiKey || !apiSecret) {
    throw new Error('bad credential format; expected <accessKeyId>:<apiKey>:<apiSecret>');
  }
  const client = new SDK.Client({ endpoint: ENDPOINT, accessKeyId, allowInsecure: ALLOW_INSECURE });
  await client.loginWithApiKey(apiKey, apiSecret);
  return client;
}

const TOOLS = [
  {
    name: 'fonoster_list_applications',
    description: 'List voice applications (AI voice agents / call flows) in the workspace.',
    inputSchema: { type: 'object', properties: { pageSize: { type: 'number' }, pageToken: { type: 'string' } } },
    run: (c, a) => new SDK.Applications(c).listApplications({ pageSize: a.pageSize || 25, pageToken: a.pageToken }),
  },
  {
    name: 'fonoster_get_application',
    description: 'Get a single voice application by ref.',
    inputSchema: { type: 'object', required: ['ref'], properties: { ref: { type: 'string' } } },
    run: (c, a) => new SDK.Applications(c).getApplication(a.ref),
  },
  {
    name: 'fonoster_list_numbers',
    description: 'List phone numbers (DIDs) provisioned in the workspace.',
    inputSchema: { type: 'object', properties: { pageSize: { type: 'number' }, pageToken: { type: 'string' } } },
    run: (c, a) => new SDK.Numbers(c).listNumbers({ pageSize: a.pageSize || 25, pageToken: a.pageToken }),
  },
  {
    name: 'fonoster_list_agents',
    description: 'List SIP agents (extensions) in the workspace.',
    inputSchema: { type: 'object', properties: { pageSize: { type: 'number' }, pageToken: { type: 'string' } } },
    run: (c, a) => new SDK.Agents(c).listAgents({ pageSize: a.pageSize || 25, pageToken: a.pageToken }),
  },
  {
    name: 'fonoster_list_calls',
    description: 'List recent calls. Optional ISO date bounds.',
    inputSchema: {
      type: 'object',
      properties: { after: { type: 'string' }, before: { type: 'string' }, pageSize: { type: 'number' } },
    },
    run: (c, a) => new SDK.Calls(c).listCalls({ after: a.after, before: a.before, pageSize: a.pageSize || 25 }),
  },
  {
    name: 'fonoster_get_call',
    description: 'Get a single call by ref.',
    inputSchema: { type: 'object', required: ['ref'], properties: { ref: { type: 'string' } } },
    run: (c, a) => new SDK.Calls(c).getCall(a.ref),
  },
  {
    name: 'fonoster_create_call',
    description: 'Place an outbound call: dial `to` from `from`, handled by the voice application `appRef`.',
    inputSchema: {
      type: 'object',
      required: ['from', 'to', 'appRef'],
      properties: {
        from: { type: 'string', description: 'E.164 caller id (a provisioned number).' },
        to: { type: 'string', description: 'E.164 destination.' },
        appRef: { type: 'string', description: 'Voice application ref that handles the call.' },
        timeout: { type: 'number' },
        metadata: {
          type: 'object',
          description: 'Key/value context forwarded to the voice application (interpolated into the autopilot prompt).',
        },
      },
    },
    run: (c, a) =>
      new SDK.Calls(c).createCall({ from: a.from, to: a.to, appRef: a.appRef, timeout: a.timeout, metadata: a.metadata }),
  },
];

const toolSpecs = () => TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));

async function handleRpc(msg, token) {
  const { id, method, params } = msg;
  if (id === undefined || id === null) return undefined;
  switch (method) {
    case 'initialize':
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER,
        instructions:
          'Voice + AI voice agent tools for Fonoster (gRPC). Authenticate with Authorization: Bearer ' +
          '<accessKeyId>:<apiKey>:<apiSecret>. Use create_call for outbound calls handled by a voice application.',
      });
    case 'ping':
      return rpcResult(id, {});
    case 'tools/list':
      return rpcResult(id, { tools: toolSpecs() });
    case 'tools/call': {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${params?.name}`);
      try {
        const client = await makeClient(token);
        const out = await tool.run(client, params?.arguments || {});
        return rpcResult(id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] });
      } catch (err) {
        return rpcResult(id, {
          content: [{ type: 'text', text: `Error calling ${params?.name}: ${err.message || err}` }],
          isError: true,
        });
      }
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

http
  .createServer((req, res) => {
    if (req.method === 'GET' && ['/healthz', '/health', '/ready'].includes(req.url)) {
      return send(res, 200, { status: 'ok', server: SERVER.name, version: SERVER.version, tools: TOOLS.length, endpoint: ENDPOINT });
    }
    if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' });
    const auth = req.headers['authorization'] || '';
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 2_000_000) req.destroy(); });
    req.on('end', async () => {
      let msg;
      try { msg = JSON.parse(raw || '{}'); } catch { return send(res, 200, rpcError(null, -32700, 'Parse error')); }
      const out = await handleRpc(msg, token);
      if (out === undefined) return send(res, 202, undefined);
      return send(res, 200, out);
    });
  })
  .listen(PORT, '0.0.0.0', () => console.log(`${SERVER.name} v${SERVER.version} (MCP/HTTP→gRPC ${ENDPOINT}) on :${PORT} — ${TOOLS.length} tools`));
