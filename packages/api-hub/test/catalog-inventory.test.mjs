import assert from 'node:assert/strict';
import test from 'node:test';
import { SapApiHubClient } from '../dist/api-hub-client.js';

const client = new SapApiHubClient({ apiHubBaseUrl: 'https://api.sap.com' });

test('lists and filters the complete public package catalog', async () => {
  const response = await client.listPackages({ q: 'SAP AI Core', top: 20, skip: 0 }, '');
  assert.ok(response.catalogTotal > 1_000);
  assert.ok(response.total >= 1);
  const aiCore = response.results.find(item => item.technicalName === 'SAPAICore');
  assert.ok(aiCore);
  assert.equal(aiCore.displayName, 'SAP AI Core');
});

test('filters packages by exact product token', async () => {
  const response = await client.listPackages({ product: 'SAPSuccessFactors', top: 200, skip: 0 }, '');
  assert.ok(response.total >= 1);
  assert.ok(response.results.every(item => item.products.includes('SAPSuccessFactors')));
});

test('paginates package artifacts with stable totals', async () => {
  const first = await client.listPackageArtifacts({ id: 'SAPAICore', top: 3, skip: 0 }, '');
  const second = await client.listPackageArtifacts({ id: 'SAPAICore', top: 3, skip: 3 }, '');
  assert.ok(first.total >= 9);
  assert.equal(first.total, second.total);
  assert.equal(first.results.length, 3);
  assert.equal(second.results.length, 3);
  assert.equal(first.hasMore, true);
  assert.equal(new Set([...first.results, ...second.results].map(item => item.id)).size, 6);
});

test('filters package artifacts by exact type', async () => {
  const response = await client.listPackageArtifacts({ id: 'SAPAICore', artifactType: 'API', top: 200, skip: 0 }, '');
  assert.ok(response.total >= 9);
  assert.ok(response.results.every(item => item.artifactType === 'API'));
});
