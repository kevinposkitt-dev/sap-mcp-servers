# SAP Business Accelerator Hub MCP — Knowledge Audit and Adoption Plan

**Audit date:** 2026-10-14  
**MCP:** `sap-api-hub-local`  
**Priority applications:** SAP Business Data Cloud (BDC), SAP AI Core, SAP S/4HANA, SAP SuccessFactors, SAP Ariba, SAP Concur  
**Purpose:** Determine what Business Accelerator Hub (BAH) content can augment local skills, searchable knowledge, knowledge graphs, and implementation workflows now.

## Executive conclusion

The BAH MCP should be used as an **authoritative integration-contract and catalog source**, not as a replacement for SAP product documentation or tenant/runtime truth.

Its highest-value roles are:

1. **Live research:** precise artifact discovery and explicit spec retrieval during implementation.
2. **Curated contract corpus:** versioned OpenAPI, AsyncAPI, EDMX, CDS/CSN, ORD, package metadata, and provenance for priority SAP products.
3. **Knowledge graph enrichment:** stable application → package → artifact → operation/schema/data-product relationships.
4. **Skill evidence:** reviewed procedures refer to exact BAH artifacts, operations, fields, versions, and source URLs without copying the whole catalog into SkillServer.
5. **Change intelligence:** hashes and metadata snapshots identify changed contracts and skills that need review.

Do **not** bulk-copy all specifications into SkillServer or Pi memory. Preserve raw contracts in a dedicated BAH corpus, index compact searchable chunks in SQLite/MemoryNet, add only stable identity/relationship edges to the knowledge graph, and keep procedural guidance in skills.

## Audit method and confidence

This audit used:

- The MCP's category listing.
- Paginated public search by category/artifact type.
- Exact metadata fetches for representative APIs.
- The complete 334-item data-product catalog.
- Existing UPP ORD/CSN retrieval and validation.
- Inspection of the MCP implementation and current local knowledge architecture.

### Important counting caveat

BAH free-text `search` is relevance-based. Its `total` is **not an authoritative application inventory count**. Broad terms produce false positives; for example, “Business Data Cloud” matches generic words such as “business”, “data”, and “cloud”. Counts below are therefore either:

- complete catalog counts (data products), or
- conservative strict-filter observations from a paginated search, clearly labelled as such.

A truly authoritative full inventory requires package enumeration and complete package-artifact pagination, which the current MCP does not yet provide.

### Authentication caveat

During the audit, the interactive protected session expired. Public search and data-product listing remained available, but protected package/spec calls required a new browser login. The plan separates public inventory from authenticated contract extraction.

## What is available now

The MCP exposes ten read-only capabilities:

| Tool | Knowledge available |
|---|---|
| `categories` | Content categories, descriptions, package counts, subtype counts |
| `search` | APIs, events, CDS views, BAdIs, BO interfaces, process artifacts, and other indexed artifacts |
| `fetch` | Normalized metadata for APIs, events, CDS views, generic artifacts, packages, and data products |
| `resources` | API paths, event channels, CDS fields/capabilities, and generic sections |
| `spec` | Full OpenAPI JSON/YAML, AsyncAPI JSON/YAML, API EDMX, CDS JSON, or raw artifact content |
| `package` | Package metadata, files/URLs, and grouped artifacts |
| `list_data_products` | Complete released data-product catalog with pagination and ORD metadata |
| `get_data_product` | Normalized data-product identity and metadata |
| `get_data_product_document` | Complete authenticated data-product document |
| `get_data_product_csn` | Output-port API ORD IDs and complete CSN |

### Hub categories observed

| Category | Reported package count | Primary use |
|---|---:|---|
| APIs | 405 | REST, OData, SOAP and other API contracts |
| Events | 31 | AsyncAPI channels and payloads |
| API Composition | — | SAP Graph/composed APIs |
| Business Objects | 1 | Business-object definitions |
| Adapters | 120 | Integration adapter discovery |
| Business Add-Ins | 2 | S/4 extensibility/BAdI evidence |
| Business Object Interfaces | 2 | S/4 extensibility interfaces |
| CDS Views | 38 | S/4 analytical and extraction semantics |
| SAP Validated Partner Use Cases | 33 | Solution/use-case discovery, lower authority than contracts |
| Process Blueprints | 36 | Process-to-integration context |

The category response currently reports zero artifact counts for some categories even though search returns artifacts. Treat package counts as useful orientation, not reconciliation totals.

## Priority application audit

### 1. SAP AI Core — immediate priority

**Strict public-search observation:** 9 APIs in package `SAPAICore`.

Observed contracts:

- `AI_CORE_API` — AI Core, REST, active, version observed `2.42.0`
- `CONTEXT_REGISTRY_API` — Context Registry
- `TABULAR_AI_ORCHESTRATION_API` — Tabular AI Orchestration, active, version observed `1.9.1`
- `LLM_BATCH_SERVICE_API` — LLM Batch Service
- `ORCHESTRATION_API_v2` — Orchestration v2
- `ORCHESTRATION_API` — Orchestration v1
- `GENAI_METRICMANAGEMENT_API` — Metric Registry
- `DOCUMENT_GROUNDING_API` — Grounding
- `PROMPT_REGISTRY_API` — Prompt Registry

**Use now:**

- Ground AI Core provisioning, monitoring, resource-group, execution, deployment, and generative-AI skills in exact paths and schemas.
- Compare v1/v2 orchestration contracts and flag skills that still teach v1 by default.
- Enrich UPP skills with exact Tabular AI Orchestration request/response contracts.
- Build operation-level graph links from AI Core capabilities to existing skills:
  - `sap-ai-core-provisioning`
  - `sap-ai-core-monitoring-troubleshooting-support`
  - `sap-ai-core-resource-group-isolation`
  - `rpt-tabpfn-api-formats`
  - `rpt-1-6-payment-prediction-api`
  - `universal-prediction-*`
- Detect contract drift in API versions, paths, resource-group headers, and payloads.

**Priority:** P0. Small, bounded, high-value package; ingest all nine APIs first.

### 2. SAP S/4HANA — immediate, domain-curated priority

**Strict public-search observation:** 449 APIs across 11 matching packages and 255 events across 5 packages. The search was complete for this query, but strict title/package matching can include integration artifacts whose endpoint is adjacent to S/4 rather than owned by its core package.

Prominent packages include:

- `SAPS4HANACloud` — SAP S/4HANA Cloud Public Edition
- `S4HANAOPAPI` — SAP S/4HANA
- `SAPS4HANABusinessEvents`
- `SAPS4HANACloudBusinessEvents`
- Public-sector, utilities, banking, tax, AIF, and Ariba CIG packages

The complete data-product catalog contains:

- 151 products tagged `SAPS4HANACloudPrivateEdition`
- 108 products tagged `SAPS4HANACloud`

**Use now:**

- Build business-domain contract packs rather than ingesting all S/4 content blindly:
  - Business Partner
  - Finance/AP/AR and Journal Entry
  - Procurement and Supplier
  - Sales Order and Billing
  - Product/Material
  - Manufacturing and Maintenance
- Link APIs ↔ events ↔ CDS views ↔ data products ↔ ORD/CSN around the same business object.
- Use EDMX/CSN to extract keys, fields, associations, SAP annotations, and operation semantics.
- Improve CAP integration and POC Factory skills with authoritative payloads and operation names.
- Drive event/API choice guidance: synchronous API versus event-driven integration.
- Add release/state checks to prevent recommending inactive or superseded interfaces.

**UPP starting set already captured and validated:**

- Supplier Invoice
- Entry View Journal Entry
- Supplier
- Payment Terms
- Company Code

References are under `~/Projects/universal-prediction-mcp/reference/sap-business-accelerator-hub/`.

**Priority:** P0 for finance/procurement/UPP; P1 for broader S/4 domains.

### 3. SAP SuccessFactors — immediate priority

**Strict complete-search observation:** 90 APIs in 13 matching packages, 8 events in 2 packages, and 44 data products in the complete data-product catalog.

Observed package domains include:

- Employee Central
- Foundation Platform
- Recruiting
- Onboarding
- Performance and Goals
- Compensation
- Calibration
- Succession and Development
- Time Off
- Time Tracking
- Ecosystem Platform

Observed events include Person, Position, Assignment, Related Person, Workflow, Purge, Onboarding Process Step, and Alumni Process events.

**Use now:**

- Create the currently missing SuccessFactors skill family.
- Build canonical workforce identity/person/employment/position semantics from API + event + data-product contracts.
- Document effective-dated OData behavior, pagination, upsert patterns, permissions, and sensitive-field handling.
- Link Employee Central data products and events to BDC workforce scenarios.
- Create event-driven employee lifecycle patterns for onboarding/offboarding and workforce replication.
- Add privacy classifications and default exclusions for HR data before knowledge ingestion.

**Priority:** P0. The current skill inventory has a clear SuccessFactors coverage gap.

### 4. SAP Ariba — immediate priority

**Strict complete-search observation:** 190 APIs across 9 matching packages and 1 directly matching event package/artifact.

Observed package areas include:

- SAP Ariba APIs
- SAP Ariba Buying
- Category Management
- Cloud Integration Gateway
- Intake Management
- Invoicing
- Procurement Planning
- Ariba Web Services
- Supplier Lifecycle and Performance

Representative APIs include supplier profile/invite/information, sourcing event, planning collaboration, catalog connectivity, and procurement configuration.

**Use now:**

- Create the currently missing Ariba skill family.
- Build source-to-pay workflows: supplier onboarding, sourcing, buying, invoicing, and collaboration.
- Map Ariba supplier/invoice/procurement concepts to S/4 and BDC data products.
- Compare legacy and v2 API contracts and make version choice explicit in skills.
- Document Cloud Integration Gateway boundaries and avoid conflating Ariba APIs with S/4 endpoints.
- Add graph paths for cross-application workflows, e.g. Ariba supplier → S/4 Business Partner/Supplier → Supplier Invoice → payment outcome.

**Priority:** P0 for supplier, sourcing, invoicing, and CIG; P1 for long-tail APIs.

### 5. SAP Concur — immediate priority

**Strict complete-search observation:** 48 APIs across 5 matching packages:

- Concur Expense
- Concur Invoice
- Concur Request
- Concur Travel
- SAP Concur Shared APIs

Representative APIs include Request, Travel Allowance, Attendees, Identity, Lists/List Items, and Financial Integration.

The broad CDS search produced false positives because field text mentioned “concurrent”; there is no evidence from this audit of a Concur CDS-view catalog. This demonstrates why package identity must outrank free-text matching.

**Use now:**

- Create the currently missing Concur skill family.
- Build expense-to-finance patterns: request → expense → attendee/itemization → approval → financial integration → S/4 posting.
- Document identity/list dependencies shared across Concur domains.
- Extract financial integration payloads and map them to S/4 accounting concepts.
- Add privacy and card/employee-data handling guidance.

**Priority:** P0 for Expense, Invoice, Identity, and Financial Integration.

### 6. SAP Business Data Cloud — priority, but BAH is only one source

A broad “Business Data Cloud” search is not a trustworthy inventory because all three words are generic. Strict filtering identified SAP Datasphere contracts such as:

- `DataSharingCockpit`
- `DatasphereConsumption`
- `DatasphereConsumptionDeprecated`

The complete data-product catalog of 334 released products is directly relevant to BDC even when products are tagged by source application rather than “BDC”.

**Use now:**

- Treat the full data-product catalog, ORD, output-port API-resource ORD, business-object IDs, and CSN as the BAH contribution to BDC knowledge.
- Link source-application data products to Datasphere/BDC onboarding, semantic registry, UCL, and prediction use cases.
- Detect deprecated API paths such as the previous Datasphere Consumption path.
- Ground existing Datasphere deployment/auth/CSN skills in exact published contracts where available.
- Use BAH package/spec data alongside—not instead of—BDC product docs, UCL, Datasphere tenant metadata, and live HANA schemas.

**Priority:** P0 for data products and Datasphere consumption/sharing; P1 for a wider BDC inventory using additional authoritative sources.

## Full-catalog opportunity beyond the six priorities

The same pipeline should eventually cover the remaining BAH surface:

- SAP Analytics Cloud
- SAP Integration Suite and adapters
- SAP Customer Experience products
- SAP Fieldglass
- SAP IBP
- SAP Asset Performance Management
- SAP Build and workflow services
- SAP Graph/API Composition
- S/4 BAdIs and BO Interfaces
- Partner use cases and process blueprints

These are P2 until the priority application packs are operational, except when an active project raises one to P0/P1.

## Use cases for the current knowledge ecosystem

### A. Skill augmentation

Use BAH to improve a skill when the skill needs exact contracts, not generic product explanation.

Add to reviewed skills:

- Artifact ID and Hub URL
- Package/application identity
- Version and lifecycle state
- Relevant operation/path/channel
- Required headers and parameters
- Request/response schema references
- Error/status behavior
- Retrieval date and content hash
- “Tenant verification required” caveat

Do not embed multi-megabyte specs in `SKILL.md`. Store references and compact reviewed examples.

### B. Knowledge graph enrichment

Recommended node types:

- `Application`
- `Package`
- `Artifact` (`API`, `Event`, `CDSView`, `BAdI`, `BOInterface`)
- `Operation`
- `Schema`
- `DataProduct`
- `OutputPort`
- `BusinessObject`
- `Skill`
- `Workflow`

Recommended evidence-backed edges:

- `Application HAS_PACKAGE Package`
- `Package CONTAINS Artifact`
- `API HAS_OPERATION Operation`
- `Event HAS_CHANNEL Channel`
- `Artifact USES_SCHEMA Schema`
- `DataProduct HAS_OUTPUT_PORT OutputPort`
- `OutputPort REFERENCES_API Artifact`
- `DataProduct USES_BUSINESS_OBJECT BusinessObject`
- `Skill DOCUMENTS Artifact`
- `Workflow REQUIRES Skill`
- `Artifact SUPERSEDES Artifact` only when version/lifecycle evidence supports it

Do not add broad “related to” edges. Preserve source URL, retrieval timestamp, version, state, and content hash on every imported fact.

### C. Searchable contract knowledge

Index compact chunks in SQLite/local knowledge:

- One metadata document per artifact
- One operation per API chunk
- One channel/message per event chunk
- One entity/definition per CSN/CDS chunk
- One package overview per package

Keep the raw source artifact in a filesystem/object-store corpus and store its path/hash in the index. Avoid indexing generated duplicates or every low-level schema fragment without contextual labels.

### D. MemoryNet

Use MemoryNet for:

- Curated implementation findings
- Cross-project decisions
- Known contract quirks
- “Skill X was reviewed against artifact Y version Z” evidence
- Relationships between use cases, APIs, and solutions

Do not use MemoryNet as the raw-spec archive. Its value is semantic recall and cross-project relationships, not duplicating every OpenAPI byte.

### E. Intelligent router

Add BAH as an optional **live contract source** for intents containing:

- API/spec/endpoint/path/payload/schema
- AsyncAPI/event/channel
- EDMX/OData entity
- data product/ORD/CSN/output port
- BAdI/BO interface

Recommended routing:

- Procedure/troubleshooting → SkillServer + MemoryNet + targeted BAH evidence
- Code/payload implementation → SQLite contract corpus + SkillServer + targeted live BAH
- Current version/lifecycle → live BAH first
- General SAP explanation → SAP Docs/Knowledge@SAP, not BAH alone
- Historical project decision → MemoryNet/Pi memory, not BAH

Fail open when interactive BAH auth is unavailable. Never make all router answers depend on a local browser session.

## Target architecture

```text
                 SAP Business Accelerator Hub
                 public catalog + protected specs
                              |
                    Local extraction runner
                  (interactive authenticated)
                              |
             +----------------+----------------+
             |                                 |
      Raw immutable corpus              Normalized manifest
 OpenAPI/AsyncAPI/EDMX/CSN/raw      IDs/version/state/hash/URL
             |                                 |
             +----------------+----------------+
                              |
                    Contract chunk builder
                              |
        +---------------------+----------------------+
        |                     |                      |
 SQLite/local search      Knowledge graph       MemoryNet
 operations/schemas       stable identities     curated findings
        |                     |                      |
        +---------------------+----------------------+
                              |
                   Intelligent MCP Router
                              |
             Skills + workflows + live BAH lookup
```

### Ownership boundaries

- **Raw BAH corpus:** authoritative retrieved contracts and provenance.
- **SQLite/local knowledge:** fast deterministic full-text/structured search.
- **Knowledge graph:** stable identities and evidence-backed relationships.
- **MemoryNet:** curated organizational learning and project/application relationships.
- **SkillServer:** reviewed procedures, not bulk documentation.
- **Live MCP:** current metadata/spec lookup and gap filling.
- **SAP Docs/Knowledge@SAP:** conceptual/product documentation.
- **Tenant APIs/HANA/Datasphere:** runtime and deployed-schema truth.

## Current MCP gaps that block a defensible full audit

1. No `list_packages` tool with complete pagination and category filtering.
2. `package` caps artifacts at 200 and does not paginate to completion.
3. No `inventory_catalog`/export operation with checkpoints and resume.
4. Broad search totals are relevance totals and easy to misinterpret.
5. No built-in deduplication across package aliases, versions, and old/new artifacts.
6. No retrieval manifest with hash, timestamp, source URL, state, and failure reason.
7. No delta mode for “changed since last snapshot”.
8. No batch spec retrieval with bounded concurrency/retry/backoff.
9. Interactive auth prevents unattended refresh.
10. Current per-tool timeout can expire while login continues.
11. Package/category reported counts cannot yet be reconciled automatically.
12. No terms/licensing classification for whether an artifact may be retained or redistributed.

## Recommended MCP enhancements

### P0 — make inventory reliable

Add:

- `list_packages(categoryKey?, q?, top, skip)`
- `list_package_artifacts(packageId, artifactType?, top, skip)`
- `inventory_catalog(categoryKeys, packageIds, includeMetadata, checkpointFile)`
- Stable normalized fields: application, package, artifact ID/type/subtype, version, state, URL
- Explicit `catalogTotal`, `returned`, `hasMore`, and `nextSkip`

### P1 — make extraction reproducible

Add:

- `export_artifact` and `export_package` to a caller-specified safe output directory
- SHA-256 hashes
- Retrieval manifest and errors ledger
- Conditional/delta retrieval
- Retry/backoff and bounded concurrency
- Resume from checkpoint
- Format availability probing before full download

### P2 — make knowledge ingestion native

Add an offline converter, not a public MCP primitive, that emits:

- `manifest.jsonl`
- Markdown summaries
- operation/channel/entity chunks
- JSON-LD graph nodes/edges
- skill-evidence candidate reports
- changed-contract impact reports

## Prioritized execution plan

### Phase 0 — immediately, no MCP changes

1. Reauthenticate locally when protected extraction is needed.
2. Capture complete AI Core package/contracts (all 9 observed APIs).
3. Capture the five UPP S/4 data products already selected and preserve their manifest.
4. Capture targeted contracts for:
   - S/4 Finance/Procurement
   - SuccessFactors Employee Central/Foundation
   - Ariba supplier/sourcing/invoice/CIG
   - Concur Expense/Invoice/Identity/Financial Integration
   - Datasphere consumption/data sharing
5. Generate compact evidence reports comparing retrieved contracts to current skills.
6. Create missing application skill families only after contract review.

### Phase 1 — reliable priority inventory

1. Implement `list_packages` and fully paginated `list_package_artifacts`.
2. Create an application/package allowlist with aliases and ownership, avoiding fuzzy-only classification.
3. Produce an exact manifest for the six priority applications.
4. Reconcile observed counts and document inaccessible/protected artifacts.
5. Add content hashes and retrieval dates.

### Phase 2 — knowledge ingestion

1. Store raw contracts outside SkillServer.
2. Chunk and index operations/channels/entities in SQLite.
3. Emit graph identity and relationship nodes with provenance.
4. Add Skill ↔ Artifact evidence edges to the existing skill graph.
5. Add targeted BAH routing to `intelligent_mcp_router.py` with fail-open behavior.
6. Store only reviewed quirks/decisions in MemoryNet.

### Phase 3 — skill uplift

Recommended first skill workstreams:

1. **AI Core contract uplift** — augment all existing AI Core/RPT/TabPFN skills.
2. **S/4 finance/procurement contract pack** — support UPP and agentic planning.
3. **SuccessFactors integration essentials** — new skill family.
4. **Ariba source-to-pay integration essentials** — new skill family.
5. **Concur expense-to-finance integration essentials** — new skill family.
6. **BDC data-product contract discovery** — augment Datasphere/UPP skills.

Each skill must include a verification step against live/current BAH metadata and a tenant-truth caveat.

### Phase 4 — change monitoring

On a deliberate local schedule:

1. Refresh package/artifact metadata.
2. Compare hashes and versions.
3. Generate an impact report listing affected skills and graph nodes.
4. Require human review before updating procedures.
5. Never auto-overwrite reviewed skills from generated documentation.

## Suggested high-value workflows

### Workflow: implement an SAP API integration

1. Search/fetch exact artifact.
2. Verify package, state, version, and protocol.
3. Inspect resources before downloading full spec.
4. Retrieve exact OpenAPI/EDMX.
5. Find a reviewed skill for auth/runtime patterns.
6. Generate client/payload code from the contract.
7. Validate against tenant configuration separately.

### Workflow: design an event-driven integration

1. Discover AsyncAPI artifact and package.
2. Extract channels/messages and payload schemas.
3. Link corresponding synchronous API and business object.
4. Select event versus polling/API based on business semantics.
5. Verify tenant event enablement separately.

### Workflow: onboard a BDC/UPP data product

1. Resolve data-product ORD identity.
2. Retrieve complete data-product document.
3. Resolve output-port API-resource ORD and CSN.
4. Validate business objects, output ports, fields, keys, and annotations.
5. Link to live Datasphere/HANA deployed object.
6. Add curated semantic mappings and leakage rules.
7. Preserve Hub contract and live-schema evidence separately.

### Workflow: review skill freshness

1. Read each skill's BAH artifact references.
2. Fetch current metadata and compare version/state/hash.
3. Flag deprecated, inactive, or changed artifacts.
4. Produce a proposed patch with evidence.
5. Require review before publishing to SkillServer.

## Governance and safety

- BAH content remains SAP content; review terms and redistribution rights before sharing a generated corpus.
- Never ingest credentials, cookies, sandbox keys, or tenant data.
- Keep protected extraction local while authentication is interactive.
- Mark generated summaries as derived and retain source URLs/hashes.
- Distinguish published contract truth from live tenant truth.
- Do not auto-generate operational skills without human review.
- Apply privacy classification before indexing SuccessFactors, Concur, supplier, or financial examples.
- Do not execute productive APIs; this MCP is a read-only catalog/specification source.

## Success measures

Within the first implementation milestone:

- 100% of the 9 observed AI Core contracts captured and indexed.
- UPP's five S/4 data-product contracts preserved and graph-linked.
- Exact package/artifact manifests for the six priority applications.
- At least one reviewed workflow skill per priority application.
- Every new skill has source artifact ID, URL, version/state, retrieval date, and tenant-truth caveat.
- Router can find operation/schema evidence in under five seconds without requiring live interactive auth.
- Delta report identifies changed contracts and impacted skills.
- No raw specification bulk is copied into SkillServer or Pi memory.

## Immediate recommendation

Start with a **Priority Contract Corpus**, not a full indiscriminate Hub dump:

1. AI Core — all 9 observed APIs.
2. S/4 — Finance/Procurement APIs/events plus the five UPP data products.
3. SuccessFactors — Employee Central, Foundation, identity, workforce events, and its 44 data products.
4. Ariba — supplier, sourcing, buying, invoicing, planning, and CIG.
5. Concur — Expense, Invoice, Identity, Request, and Financial Integration.
6. BDC — full data-product identity layer plus Datasphere consumption/sharing contracts.

In parallel, add reliable package enumeration and manifests to the MCP. Once exact counts, hashes, and resumable exports exist, expand to the full 405-package API surface and the other Hub categories.
