# Set Up a Local SAP Business Accelerator Hub MCP with Your LLM

Use this document as a handoff prompt for an LLM or coding agent that can edit files, run shell commands, and configure your local MCP client.

> **Scope:** Local, read-only access to SAP Business Accelerator Hub catalog metadata, specifications, data-product ORD metadata, complete data-product documents, and output-port CSN.
>
> **Important:** This is an unofficial integration and is not endorsed by SAP. Confirm that its use complies with SAP terms and your organization's policies. Do not deploy it as a shared or production service without explicit approval.

---

## Prompt to give your LLM

Copy everything in this section into your coding assistant. Replace values in `<ANGLE_BRACKETS>` first, or tell the assistant to ask you for them.

```text
Set up and validate the enhanced SAP Business Accelerator Hub MCP on my local machine.

Goals:
1. Clone and build the MCP source locally.
2. Configure my MCP client to run the built server over stdio.
3. Use interactive SAP authentication in a visible browser; do not ask me for or store my SAP password or Business Accelerator Hub sandbox API key.
4. Keep all session/authentication files outside source control and accessible only to my OS user.
5. Restart or reconnect the MCP client and verify all ten tools.
6. Test public catalog search and, after I complete SAP sign-in, test protected data-product document and CSN retrieval.
7. Report the exact files changed and test results. Do not publish an npm package, push code, or deploy/merge anything unless I explicitly ask.

Source:
- Repository: https://github.com/kevinposkitt-dev/sap-mcp-servers.git
- Branch: feat/data-product-tools
- Expected baseline commit: 77c33df or a later commit on that branch
- Local destination: <ABSOLUTE_LOCAL_REPOSITORY_PATH>
- MCP server name: sap-api-hub-local
- MCP client config file: <ABSOLUTE_MCP_CONFIG_PATH>
- Private auth directory: <ABSOLUTE_PRIVATE_AUTH_DIRECTORY>

Requirements:
- Node.js 22.12 or newer
- npm
- Git
- A local graphical desktop/browser session for interactive SAP SSO/MFA

Safety rules:
- Never print, read back, summarize, transmit, or commit token-cache contents, cookies, passwords, PFX passphrases, or API keys.
- Do not put credentials in the repository or MCP JSON.
- Use AUTH_METHOD=interactive and HEADFUL=true.
- Set the session-cache path outside the repository.
- Create the private auth directory with user-only permissions and ensure cache files use mode 0600 where supported.
- Redact environment values whose names contain key, token, secret, password, cookie, or passphrase.
- Do not use my SAP Business Accelerator Hub sandbox API key. It is not needed for this workflow.
- Do not publish to npm or deploy this as an unattended hosted service.

Procedure:
1. Check the operating system, CPU architecture, Node/npm/Git versions, destination paths, and current MCP configuration. Preserve all unrelated configuration and working-tree changes.
2. Clone the specified branch if the repository does not exist. If it exists, verify its remote and branch without deleting local changes.
3. From the repository root run:
   npm install
   npm run install:browsers
   npm run build:auth
   npm run build -w sap-api-hub-mcp
   npm run test:data-products -w sap-api-hub-mcp
4. Create the private auth directory outside the repository.
5. Add or update only the sap-api-hub-local entry in my MCP configuration. Use node with the absolute path to packages/api-hub/dist/mcp-server.js and this environment:
   AUTH_METHOD=interactive
   HEADFUL=true
   MFA_TIMEOUT=300000
   API_HUB_TOKEN_CACHE_FILE=<PRIVATE_AUTH_DIRECTORY>/api-hub-token-cache.json
   MCP_MODE=true
6. Do not place SAP_USERNAME, SAP_PASSWORD, a PFX passphrase, cookies, or an API key in the MCP configuration.
7. Ask me to restart/reload my MCP client if required, then connect sap-api-hub-local.
8. Confirm these ten tools are available:
   categories
   search
   fetch
   resources
   spec
   package
   list_data_products
   get_data_product
   get_data_product_document
   get_data_product_csn
9. Search the complete data-product catalog for "supplier invoice". Confirm that the search scans the complete catalog rather than only one page.
10. Resolve the Supplier Invoice result by exact data-product ORD ID.
11. Call get_data_product_document. A browser may open. Pause and tell me to complete SAP sign-in/MFA in that browser. Do not request my credentials in chat.
12. If the MCP call times out while the browser is waiting, let me finish authentication and retry the same call. Do not treat the first gateway timeout as an authentication failure.
13. Call get_data_product_csn and validate all of the following:
    - Data-product ORD ID matches get_data_product metadata.
    - Complete document OutputPorts[].TechnicalName matches the CSN document technical name.
    - Complete document OutputPorts[].OrdId matches the independently resolved API-resource ORD ID.
    - CSN is valid JSON and has populated definitions.
14. Ensure the generated token cache is outside the repository and mode 0600 where supported. Never display its contents.
15. Give me a concise final report with connection status, tool count, public/protected test results, ORD/CSN validation, build/test status, and any remaining limitations.

Expected Supplier Invoice validation values:
- Technical name: sap-s4com-SupplierInvoice-v1
- Data-product ORD ID: sap.s4com:dataProduct:SupplierInvoice:v1
- API-resource ORD ID: sap.s4com:apiResource:SupplierInvoice:v1
- Expected CSN definitions include SupplierInvoice and SupplierInvoiceItem
```

---

## Manual setup reference

The following commands are examples. Use absolute paths appropriate for your machine.

### 1. Prerequisites

Check that Node.js meets the repository requirement:

```bash
node --version
npm --version
git --version
```

Node.js must be **22.12.0 or newer**.

### 2. Clone the enhanced branch

```bash
git clone --branch feat/data-product-tools \
  https://github.com/kevinposkitt-dev/sap-mcp-servers.git
cd sap-mcp-servers
```

If the repository already exists, do not reset or delete local changes. Inspect it first:

```bash
git status --short --branch
git remote -v
git log -1 --oneline
```

### 3. Install and build

Run from the monorepo root:

```bash
npm install
npm run install:browsers
npm run build:auth
npm run build -w sap-api-hub-mcp
npm run test:data-products -w sap-api-hub-mcp
```

The local MCP entry point will be:

```text
<REPOSITORY>/packages/api-hub/dist/mcp-server.js
```

### 4. Create a private session directory

macOS/Linux example:

```bash
mkdir -p "$HOME/.config/sap-api-hub-mcp"
chmod 700 "$HOME/.config/sap-api-hub-mcp"
```

Windows PowerShell example:

```powershell
New-Item -ItemType Directory -Force "$HOME\.config\sap-api-hub-mcp"
```

Do not create this directory inside the Git repository or a cloud-synchronized/shared folder.

### 5. Configure an MCP client

Add the following server to the client's MCP JSON. Merge it into the existing `mcpServers` object—do not overwrite unrelated servers.

```json
{
  "mcpServers": {
    "sap-api-hub-local": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/sap-mcp-servers/packages/api-hub/dist/mcp-server.js"
      ],
      "env": {
        "AUTH_METHOD": "interactive",
        "HEADFUL": "true",
        "MFA_TIMEOUT": "300000",
        "API_HUB_TOKEN_CACHE_FILE": "/ABSOLUTE/PRIVATE/PATH/api-hub-token-cache.json",
        "MCP_MODE": "true"
      },
      "description": "Local read-only SAP Business Accelerator Hub MCP with Data Product ORD and CSN tools",
      "disabled": false
    }
  }
}
```

Typical MCP configuration locations vary by client. For Pi, the default is:

```text
~/.pi/agent/mcp.json
```

Use valid absolute paths. On Windows JSON paths, either use forward slashes or escape backslashes.

Do **not** add any of these to the JSON:

- `SAP_PASSWORD`
- `PFX_PASSPHRASE`
- Session cookies
- A Business Accelerator Hub sandbox API key

Restart or reload the MCP client after changing its configuration.

---

## Available tools and what to do with them

| Tool | Purpose |
|---|---|
| `categories` | List Business Accelerator Hub content categories and counts. |
| `search` | Search APIs, events, CDS views, and other catalog artifacts. |
| `fetch` | Retrieve normalized metadata for an artifact or package. |
| `resources` | Summarize API paths, event channels, CDS fields, or artifact sections. |
| `spec` | Explicitly retrieve a complete OpenAPI, AsyncAPI, EDMX, CDS JSON, or raw specification. |
| `package` | Retrieve package metadata, documentation, and grouped artifacts. |
| `list_data_products` | Search the complete released data-product catalog with pagination and ORD metadata. |
| `get_data_product` | Retrieve normalized data-product metadata by technical name or exact ORD ID. |
| `get_data_product_document` | Retrieve the complete authenticated data-product `$value` JSON document. |
| `get_data_product_csn` | Resolve output-port APIs, API-resource ORD IDs, and complete CSN definitions. |

### Useful requests to give your LLM

#### Discover a data product

```text
Use sap-api-hub-local to search the complete data-product catalog for supplier invoice products. Show the title, technical name, version, lifecycle state, data-product ORD ID, business objects, and output ports. Do not use an API key.
```

#### Retrieve and validate ORD plus CSN

```text
Resolve data product sap.s4com:dataProduct:SupplierInvoice:v1. Retrieve its normalized metadata, complete data-product document, and complete output-port CSN. Validate that the document output-port technical name and API-resource ORD ID correspond to the CSN resource. Summarize definition names, keys, types, and important SAP annotations without dumping the entire CSN into chat.
```

#### Build a local semantic reference bundle

```text
For these exact data-product ORD IDs, retrieve metadata, complete data-product documents, and output-port CSNs. Save a manifest plus one directory per technical name. Validate every ORD and technical-name relationship. Do not store auth files in the project and do not commit generated files until I review their size and licensing/policy implications.
```

#### Inspect an API safely

```text
Search Business Accelerator Hub for the relevant API. Fetch normalized metadata and summarize its resources first. Retrieve the complete spec only if needed, then identify operations, required fields, authentication information, and deprecation/release status. Treat all operations as read-only research; do not call a sandbox or productive business API.
```

---

## Correct ORD and CSN validation

Do not infer identifiers by string replacement. Validate them from authoritative responses:

1. `get_data_product` supplies the data-product technical name and data-product ORD ID.
2. `get_data_product_document` supplies complete `BusinessObjects` and `OutputPorts`, including output-port `OrdId`.
3. `get_data_product_csn` independently resolves each output-port API-resource ORD ID and its complete CSN.
4. Confirm:
   - Requested ORD ID equals returned data-product ORD ID.
   - Document output-port technical name equals CSN document technical name.
   - Document output-port ORD ID equals independently resolved API-resource ORD ID.
   - CSN parses as JSON and contains non-empty `definitions`.

Normalized metadata may omit an output-port ORD ID even when the complete document contains it. Use the complete document for authoritative output-port metadata.

---

## Authentication behavior

Public catalog operations may work without login. Protected `$value` documents and specifications can require SAP authentication.

With interactive authentication:

1. A Playwright browser opens visibly.
2. The user completes SAP SSO and MFA directly in the browser.
3. The MCP stores API Hub session cookies in the configured private cache.
4. Later calls reuse the cache until it expires or becomes invalid.

An MCP client may time out before the interactive login timeout expires. If that happens:

- Keep the browser open.
- Finish SAP sign-in.
- Retry the protected tool call.
- Do not expose or manually copy cookies.

After login, macOS/Linux users should verify permissions without reading the file:

```bash
chmod 600 "$HOME/.config/sap-api-hub-mcp/api-hub-token-cache.json"
ls -l "$HOME/.config/sap-api-hub-mcp/api-hub-token-cache.json"
```

The enhanced auth implementation also enforces mode `0600` when writing the cache on supported systems.

---

## Local-only limitation

The interactive configuration is **not an unattended BTP hosting design**. It depends on:

- A visible browser
- Human SAP SSO/MFA
- Local session-cookie persistence
- Reauthentication when the session expires

Do not copy a local cookie cache into Cloud Foundry, Kyma, a container image, a Git repository, or a shared secret as a workaround. A hosted service needs an SAP-supported machine-to-machine or delegated per-user authentication design for the relevant endpoints.

---

## Troubleshooting

### Server does not connect

Check:

- The `node` command is available to the MCP client.
- The entry-point path is absolute and exists.
- The repository was built successfully.
- JSON syntax is valid.
- The MCP client was restarted after configuration changes.

Rebuild:

```bash
npm run build:auth
npm run build -w sap-api-hub-mcp
```

### Chromium is missing

```bash
npm run install:browsers
```

### Protected call times out

Complete the login in the open browser and retry. The MCP gateway timeout may be shorter than `MFA_TIMEOUT`.

### Authentication repeatedly fails

Without displaying cache contents:

1. Confirm `AUTH_METHOD=interactive` and `HEADFUL=true`.
2. Confirm the cache parent directory exists and is writable only by the user.
3. Close stale Playwright browser processes only after confirming no login is in progress.
4. Move the stale cache to a private backup location or remove it, then authenticate again.
5. Never paste cookies into chat or source files.

### Public data-product test

From the repository root:

```bash
npm run test:data-products -w sap-api-hub-mcp
```

This validates public complete-catalog pagination and resolution by technical name and exact ORD ID.

---

## Final acceptance checklist

- [ ] Node.js is 22.12.0 or newer.
- [ ] The enhanced `feat/data-product-tools` branch is checked out.
- [ ] Dependencies and Playwright Chromium are installed.
- [ ] Shared auth and API Hub packages build successfully.
- [ ] Data-product tests pass.
- [ ] MCP configuration uses absolute paths.
- [ ] No password, API key, cookie, or passphrase is stored in source control or MCP JSON.
- [ ] Authentication/session files are outside the repository.
- [ ] `sap-api-hub-local` exposes all ten expected tools.
- [ ] Public catalog search succeeds.
- [ ] Interactive browser login succeeds for protected retrieval.
- [ ] Data-product ORD ID, output-port technical name, API-resource ORD ID, and CSN correspond.
- [ ] The user understands that this interactive design is local-only, not unattended BTP hosting.
