# BAH Priority Knowledge Refresh

This pipeline inventories priority SAP Business Accelerator Hub packages, builds a provenance-bearing manifest and graph, detects drift, and creates an offline SQLite FTS index.

## Commands

```bash
npm run bah:refresh
npm run bah:index
```

Public weekly metadata refresh:

```bash
bash tools/bah-knowledge/install-launchd.sh
```

Protected specification refresh, run manually after interactive SAP login:

```bash
API_HUB_TOKEN_CACHE_FILE="$HOME/.config/sap-api-hub-mcp/api-hub-token-cache.json" \
  npm run bah:refresh:specs
npm run bah:index
```

The script never logs or copies the cache. It reads only the cached cookie header to request protected specifications.

## Outputs

`knowledge/bah/current/` contains:

- `manifest.json` — applications, packages, artifacts, Data Products, hashes, and errors
- `changes.json` — additions, removals, and metadata changes versus the previous run
- `REFRESH_REPORT.md` — human review queue
- `chunks.json` — compact records for offline search
- `knowledge-graph.jsonld` — provenance-bearing application/package/artifact/Data Product graph
- `bah-knowledge.db` — generated FTS5 index
- `packages/*/artifacts.json` — complete paginated package inventories
- `raw/*` — protected specs only when `--include-specs` is used with a valid session

The previous snapshot is retained under `knowledge/bah/previous/` for one refresh cycle.

## Routine

- **Weekly:** public metadata inventory and drift report. This is safe to schedule unattended.
- **Monthly:** manually authenticate and refresh protected specifications.
- **Before implementation/release:** perform targeted live fetch for the exact artifact and validate tenant reality separately.
- **After drift:** review affected skills; never auto-overwrite reviewed SkillServer content.

## Boundaries

- Raw contracts belong in this corpus, not SkillServer or MemoryNet.
- SQLite is the deterministic operation/schema search layer.
- The graph stores stable identities and evidence-backed relationships.
- MemoryNet stores reviewed findings and decisions only.
- SkillServer stores reviewed procedures with artifact/version/hash evidence.
- Interactive auth means protected refresh cannot be a reliable unattended BTP job.
