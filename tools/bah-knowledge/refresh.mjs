#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SapApiHubClient } from '../../packages/api-hub/dist/api-hub-client.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');
const configPath = join(here, 'priority-applications.json');
const outputRoot = resolve(process.env.BAH_KNOWLEDGE_OUTPUT || join(repoRoot, 'knowledge/bah'));
const includeSpecs = process.argv.includes('--include-specs');
const authCache = process.env.API_HUB_TOKEN_CACHE_FILE || join(process.env.HOME || '', '.config/sap-api-hub-mcp/api-hub-token-cache.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const client = new SapApiHubClient({ apiHubBaseUrl: 'https://api.sap.com' });
const generatedAt = new Date().toISOString();

function sha256(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function safeName(value) {
  return value.replace(/[^A-Za-z0-9._-]+/g, '_');
}

function loadCookie() {
  if (!includeSpecs || !existsSync(authCache)) return '';
  try {
    const cached = JSON.parse(readFileSync(authCache, 'utf8'));
    return typeof cached.access_token === 'string' ? cached.access_token : '';
  } catch {
    return '';
  }
}

async function allPackageArtifacts(packageId) {
  const results = [];
  let skip = 0;
  let total = 0;
  do {
    const page = await client.listPackageArtifacts({ id: packageId, top: 200, skip }, '');
    total = page.total;
    results.push(...page.results);
    skip += page.results.length;
    if (!page.results.length) break;
  } while (skip < total);
  return { total, results };
}

function specRequest(artifact) {
  switch (artifact.artifactType) {
    case 'API': return { id: artifact.id, kind: 'api', format: 'json' };
    case 'Event': return { id: artifact.id, kind: 'event', format: 'json', version: artifact.version };
    case 'CDSVIEW': return { id: artifact.id, kind: 'cdsview', format: 'json' };
    default: return undefined;
  }
}

function operationChunks(spec, artifact, application, packageInfo) {
  const chunks = [];
  if (!spec || typeof spec !== 'object') return chunks;
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']) {
      const operation = pathItem[method];
      if (!operation || typeof operation !== 'object') continue;
      chunks.push({
        id: `operation:${artifact.id}:${method}:${path}`,
        kind: 'api-operation', applicationId: application.id, applicationTitle: application.title,
        packageId: packageInfo.technicalName, packageTitle: packageInfo.displayName,
        artifactId: artifact.id, artifactTitle: artifact.title, artifactVersion: artifact.version,
        method: method.toUpperCase(), path, operationId: operation.operationId,
        summary: operation.summary, description: operation.description,
        tags: operation.tags || [], parameters: operation.parameters || [],
        sourceUrl: artifact.url
      });
    }
  }
  for (const [channel, channelItem] of Object.entries(spec.channels || {})) {
    chunks.push({
      id: `channel:${artifact.id}:${channel}`, kind: 'event-channel', applicationId: application.id,
      applicationTitle: application.title, packageId: packageInfo.technicalName,
      packageTitle: packageInfo.displayName, artifactId: artifact.id, artifactTitle: artifact.title,
      artifactVersion: artifact.version, channel, summary: channelItem?.summary,
      description: channelItem?.description, sourceUrl: artifact.url
    });
  }
  for (const [name, definition] of Object.entries(spec.definitions || {})) {
    chunks.push({
      id: `definition:${artifact.id}:${name}`, kind: 'csn-definition', applicationId: application.id,
      applicationTitle: application.title, packageId: packageInfo.technicalName,
      packageTitle: packageInfo.displayName, artifactId: artifact.id, artifactTitle: artifact.title,
      artifactVersion: artifact.version, definitionName: name, definition, sourceUrl: artifact.url
    });
  }
  return chunks;
}

function diffManifests(previous, current) {
  const key = item => `${item.applicationId}:${item.packageId}:${item.artifactType}:${item.id}`;
  const before = new Map((previous?.artifacts || []).map(item => [key(item), item]));
  const after = new Map(current.artifacts.map(item => [key(item), item]));
  const added = [], removed = [], changed = [];
  for (const [id, item] of after) {
    if (!before.has(id)) added.push(item);
    else if (before.get(id).hash !== item.hash) changed.push({ before: before.get(id), after: item });
  }
  for (const [id, item] of before) if (!after.has(id)) removed.push(item);
  return { generatedAt, previousGeneratedAt: previous?.generatedAt, added, removed, changed };
}

const current = join(outputRoot, 'current');
const previous = join(outputRoot, 'previous');
const previousManifest = existsSync(join(current, 'manifest.json')) ? JSON.parse(readFileSync(join(current, 'manifest.json'), 'utf8')) : undefined;
rmSync(previous, { recursive: true, force: true });
if (existsSync(current)) renameSync(current, previous);
mkdirSync(current, { recursive: true });

const cookie = loadCookie();
const manifest = { schemaVersion: '1.0.0', generatedAt, source: 'SAP Business Accelerator Hub', includeSpecs, authenticatedSpecs: Boolean(cookie), applications: [], packages: [], artifacts: [], dataProducts: [], errors: [] };
const chunks = [];
const graph = { '@context': { bah: 'https://api.sap.com/', type: '@type', id: '@id' }, '@graph': [] };

const configuredPackageIds = [...new Set(config.applications.flatMap(application => application.packages))];
const packageById = new Map();
for (const packageId of configuredPackageIds) {
  try {
    const detail = await client.fetchPackage({ id: packageId, includeArtifacts: false, top: 1 }, '');
    packageById.set(packageId, {
      technicalName: detail.id,
      displayName: detail.title,
      description: detail.description,
      version: detail.version,
      vendor: detail.vendor,
      state: detail.state,
      modifiedAt: detail.modifiedAt,
      docs: detail.docs,
      url: `https://api.sap.com/package/${encodeURIComponent(packageId)}`
    });
  } catch {
    // Missing packages are recorded in the manifest below.
  }
}

for (const application of config.applications) {
  manifest.applications.push({ id: application.id, title: application.title, priority: application.priority, packages: application.packages });
  graph['@graph'].push({ id: `application:${application.id}`, type: 'Application', title: application.title, priority: application.priority });
  for (const packageId of application.packages) {
    const packageInfo = packageById.get(packageId);
    if (!packageInfo) {
      manifest.errors.push({ scope: 'package', applicationId: application.id, packageId, error: 'Package not found in public catalog' });
      continue;
    }
    const packageRecord = { ...packageInfo, applicationId: application.id, hash: sha256(packageInfo) };
    manifest.packages.push(packageRecord);
    graph['@graph'].push({ id: `package:${packageId}`, type: 'Package', title: packageInfo.displayName, application: `application:${application.id}`, sourceUrl: packageInfo.url, hash: packageRecord.hash });
    try {
      const inventory = await allPackageArtifacts(packageId);
      writeJson(join(current, 'packages', safeName(packageId), 'artifacts.json'), inventory);
      for (const artifact of inventory.results) {
        const artifactRecord = { ...artifact, applicationId: application.id, hash: sha256(artifact) };
        manifest.artifacts.push(artifactRecord);
        graph['@graph'].push({ id: `artifact:${artifact.artifactType}:${artifact.id}`, type: artifact.artifactType || 'Artifact', title: artifact.title, package: `package:${packageId}`, version: artifact.version, state: artifact.state, sourceUrl: artifact.url, hash: artifactRecord.hash });
        chunks.push({ id: `artifact:${artifact.artifactType}:${artifact.id}`, kind: 'artifact', applicationId: application.id, applicationTitle: application.title, packageId, packageTitle: packageInfo.displayName, ...artifact, sourceHash: artifactRecord.hash });
        const request = specRequest(artifact);
        if (!cookie || !request) continue;
        try {
          const raw = await client.spec(request, cookie);
          const ext = raw.contentType.includes('json') ? 'json' : request.format;
          const rawPath = join(current, 'raw', application.id, safeName(packageId), `${safeName(artifact.artifactType || 'artifact')}--${safeName(artifact.id)}.${ext}`);
          mkdirSync(dirname(rawPath), { recursive: true });
          writeFileSync(rawPath, raw.text.endsWith('\n') ? raw.text : `${raw.text}\n`);
          const parsed = ext === 'json' ? JSON.parse(raw.text) : undefined;
          const specHash = sha256(raw.text);
          artifactRecord.spec = { path: rawPath.slice(current.length + 1), format: request.format, contentType: raw.contentType, size: raw.text.length, hash: specHash, sourceUrl: raw.url };
          chunks.push(...operationChunks(parsed, artifact, application, packageInfo).map(chunk => ({ ...chunk, sourceHash: specHash })));
        } catch (error) {
          manifest.errors.push({ scope: 'spec', applicationId: application.id, packageId, artifactId: artifact.id, artifactType: artifact.artifactType, error: error instanceof Error ? error.message : String(error) });
        }
      }
    } catch (error) {
      manifest.errors.push({ scope: 'package-artifacts', applicationId: application.id, packageId, error: error instanceof Error ? error.message : String(error) });
    }
  }
}

const firstDataProductPage = await client.listDataProducts({ top: 200, skip: 0 }, '');
const secondDataProductPage = firstDataProductPage.hasMore ? await client.listDataProducts({ top: 200, skip: 200 }, '') : { results: [] };
const allDataProducts = [...firstDataProductPage.results, ...secondDataProductPage.results];
for (const application of config.applications) {
  const products = new Set(application.dataProductProducts || []);
  if (!products.size) continue;
  for (const product of allDataProducts) {
    if (!(product.products || []).some(item => products.has(item))) continue;
    const record = { ...product, applicationId: application.id, hash: sha256(product) };
    manifest.dataProducts.push(record);
    graph['@graph'].push({ id: `dataProduct:${product.ordId || product.technicalName}`, type: 'DataProduct', title: product.displayName, application: `application:${application.id}`, ordId: product.ordId, sourceUrl: product.url, hash: record.hash });
    chunks.push({ id: `dataProduct:${application.id}:${product.ordId || product.technicalName}`, kind: 'data-product', applicationId: application.id, applicationTitle: application.title, ...product, sourceHash: record.hash });
  }
}

manifest.summary = {
  applicationCount: manifest.applications.length,
  packageCount: manifest.packages.length,
  artifactCount: manifest.artifacts.length,
  dataProductCount: manifest.dataProducts.length,
  chunkCount: chunks.length,
  errorCount: manifest.errors.length
};
writeJson(join(current, 'manifest.json'), manifest);
writeJson(join(current, 'chunks.json'), chunks);
writeJson(join(current, 'knowledge-graph.jsonld'), graph);
const changes = diffManifests(previousManifest, manifest);
writeJson(join(current, 'changes.json'), changes);
const report = [
  '# SAP Business Accelerator Hub Refresh Report', '',
  `- Generated: ${generatedAt}`,
  `- Applications: ${manifest.summary.applicationCount}`,
  `- Packages: ${manifest.summary.packageCount}`,
  `- Artifacts: ${manifest.summary.artifactCount}`,
  `- Data products: ${manifest.summary.dataProductCount}`,
  `- Search chunks: ${manifest.summary.chunkCount}`,
  `- Protected specifications retrieved: ${includeSpecs && cookie ? 'yes' : 'no'}`,
  `- Errors: ${manifest.summary.errorCount}`,
  `- Added artifacts: ${changes.added.length}`,
  `- Changed artifacts: ${changes.changed.length}`,
  `- Removed artifacts: ${changes.removed.length}`,
  '',
  '## Review required', '',
  'Changes in this report are candidates for human review. Do not automatically overwrite reviewed skills.', ''
];
for (const item of changes.changed.slice(0, 100)) report.push(`- Changed: ${item.after.applicationId} / ${item.after.packageId} / ${item.after.id}`);
for (const item of changes.added.slice(0, 100)) report.push(`- Added: ${item.applicationId} / ${item.packageId} / ${item.id}`);
for (const item of changes.removed.slice(0, 100)) report.push(`- Removed: ${item.applicationId} / ${item.packageId} / ${item.id}`);
writeFileSync(join(current, 'REFRESH_REPORT.md'), `${report.join('\n')}\n`);
console.log(JSON.stringify(manifest.summary));
if (manifest.errors.length) console.error(`Completed with ${manifest.errors.length} recorded error(s); inspect current/manifest.json.`);
