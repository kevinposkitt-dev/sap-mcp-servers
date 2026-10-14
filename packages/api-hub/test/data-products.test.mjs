import assert from 'node:assert/strict';
import test from 'node:test';
import { SapApiHubClient } from '../dist/api-hub-client.js';

const client = new SapApiHubClient({ apiHubBaseUrl: 'https://api.sap.com' });
const technicalName = 'sap-bdc-sf-performance-PerformanceGoals-v1';
const ordId = 'sap.bdc.sf.performance:dataProduct:PerformanceGoals:v1';

test('lists and filters the complete public data-product catalog', async () => {
  const response = await client.listDataProducts({ q: 'Performance Goals', top: 2, skip: 0 }, '');
  assert.ok(response.catalogTotal > 300);
  assert.ok(response.total >= 1);
  assert.equal(response.results[0].technicalName, technicalName);
  assert.equal(response.results[0].ordId, ordId);
  assert.equal(response.results[0].outputPorts[0].TechnicalName, technicalName);
});

test('gets a public data product by technical name', async () => {
  const product = await client.getDataProduct({ id: technicalName }, '');
  assert.equal(product.technicalName, technicalName);
  assert.equal(product.ordId, ordId);
});

test('resolves a public data product by exact ORD ID', async () => {
  const product = await client.getDataProduct({ id: ordId }, '');
  assert.equal(product.technicalName, technicalName);
  assert.equal(product.ordId, ordId);
});
