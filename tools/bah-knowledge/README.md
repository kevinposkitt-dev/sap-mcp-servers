# BAH Priority Knowledge Refresh

This pipeline inventories priority SAP Business Accelerator Hub packages, builds a provenance-bearing manifest and graph, detects drift, and creates an offline SQLite FTS index.

## Commands

```bash
npm run bah:refresh
npm run bah:index
npm run bah:validate
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

`tools/bah-knowledge/curated-knowledge.json` defines reviewed Skill-to-Artifact evidence and six additive S/4HANA domain packs. Generated evidence records include artifact ID, package ID, version/state, source URL, retrieval date, and source hash. The full S/4 inventory remains available; domain packs are retrieval scopes, not inventory filters.

## Freshness, drift, and alerts

- Public metadata is stale after 14 days.
- Protected specifications are stale after 45 days.
- Run a targeted live contract check before implementation or release.
- Protected refresh remains monthly and manual; reviewed skills require human review before updates.
- Drift is classified as `BREAKING`, `BEHAVIORAL`, `ADDITIVE`, `DOCUMENTATION_ONLY`, `LIFECYCLE`, or `UNKNOWN`.
- `manifest.json` alerts on manifest errors, missing priority packages, removed artifacts, version/lifecycle changes, and protected-spec age over 45 days.
- A non-zero scheduled-refresh process exit is the scheduled refresh failure signal; launchd writes stdout/stderr under `~/Library/Logs/sap-bah-knowledge/`.

Run `npm run bah:validate` after an authenticated refresh. It validates operation/channel/CSN chunks, provenance, curated evidence, domain packs, graph edges, and credential-pattern absence without displaying raw specifications.

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
