#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const snapshot = resolve(process.argv[2] || 'knowledge/bah/current');
const manifest = JSON.parse(readFileSync(join(snapshot, 'manifest.json'), 'utf8'));
const chunks = JSON.parse(readFileSync(join(snapshot, 'chunks.json'), 'utf8'));
const graph = JSON.parse(readFileSync(join(snapshot, 'knowledge-graph.jsonld'), 'utf8'));

assert.equal(manifest.authenticatedSpecs, true, 'authenticatedSpecs must be true');
assert.ok(manifest.artifacts.some(item => item.spec?.hash && item.spec?.sourceUrl), 'protected specs need hashes and source URLs');
for (const kind of ['api-operation', 'event-channel', 'csn-definition']) {
  assert.ok(chunks.some(chunk => chunk.kind === kind), `missing ${kind} chunks`);
}
for (const chunk of chunks.filter(item => ['api-operation', 'event-channel', 'csn-definition'].includes(item.kind))) {
  assert.ok(chunk.sourceHash, `${chunk.id} has no source hash`);
  assert.ok(chunk.sourceUrl, `${chunk.id} has no source URL`);
}
for (const mapping of manifest.skillEvidence || []) {
  assert.ok(mapping.evidence.length, `${mapping.skill} has no evidence`);
  for (const item of mapping.evidence) {
    for (const field of ['artifactId', 'packageId', 'version', 'state', 'sourceUrl', 'retrievalDate', 'sourceHash']) {
      assert.ok(item[field], `${mapping.skill}/${item.artifactId} has no ${field}`);
    }
  }
}
assert.equal((manifest.domainPacks || []).length, 6, 'six S/4 domain packs are required');
assert.ok(graph['@graph'].some(item => item.type === 'SkillArtifactEvidence'), 'graph has no skill evidence nodes');
const serialized = JSON.stringify({ manifest, chunks, graph });
for (const pattern of [/access_token/i, /refresh_token/i, /set-cookie/i, /BEGIN PRIVATE KEY/]) {
  assert.equal(pattern.test(serialized), false, `generated metadata matches forbidden credential pattern ${pattern}`);
}
const cachePath = process.env.API_HUB_TOKEN_CACHE_FILE;
if (cachePath && existsSync(cachePath)) {
  const privateCache = JSON.parse(readFileSync(cachePath, 'utf8'));
  const privateValues = [];
  function collectPrivateValues(value) {
    if (Array.isArray(value)) return value.forEach(collectPrivateValues);
    if (value && typeof value === 'object') return Object.values(value).forEach(collectPrivateValues);
    if (typeof value === 'string' && value.length >= 16) privateValues.push(value);
  }
  collectPrivateValues(privateCache);
  for (const value of privateValues) assert.equal(serialized.includes(value), false, 'generated metadata contains a value from the private authentication cache');
}
console.log(JSON.stringify({
  authenticatedSpecs: manifest.authenticatedSpecs,
  artifactsWithSpecs: manifest.artifacts.filter(item => item.spec).length,
  errors: manifest.errors.length,
  chunks: chunks.length,
  operationChunks: chunks.filter(item => item.kind === 'api-operation').length,
  eventChannelChunks: chunks.filter(item => item.kind === 'event-channel').length,
  csnDefinitionChunks: chunks.filter(item => item.kind === 'csn-definition').length,
  skillEvidenceMappings: manifest.skillEvidence.length,
  domainPacks: manifest.domainPacks.length,
  alerts: manifest.alerts.length
}));
