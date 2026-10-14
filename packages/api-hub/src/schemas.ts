import { z } from 'zod';

export const KindSchema = z.enum(['api', 'event', 'cdsview', 'artifact', 'package', 'dataproduct']);
export const ResourceKindSchema = z.enum(['api', 'event', 'cdsview', 'artifact']);
export const SpecKindSchema = z.enum(['api', 'event', 'cdsview', 'artifact']);
export const SpecFormatSchema = z.enum(['json', 'yaml', 'edmx', 'raw']);

export const SearchInputSchema = {
  q: z.string().min(1).max(200).describe('Search text, for example "sales order", "work zone", or "Transit Shipment".'),
  categoryKey: z.string().min(1).optional().describe('Optional API Hub category key, for example API, Events, CDSViews, S4HANACloudBADI.'),
  artifactType: z.string().min(1).optional().describe('Optional artifact type, for example API, Event, CDSVIEW, BADI.'),
  top: z.number().int().min(1).max(50).default(10).describe('Maximum number of results.'),
  skip: z.number().int().min(0).default(0).describe('Number of results to skip.')
};

export const FetchInputSchema = {
  id: z.string().min(1).describe('Artifact ID, for example salesorder, Transit_Shipment_Events_S4HANA, or I_FINSGLERRORITEMDETAIL.'),
  kind: KindSchema.describe('Artifact kind. Use artifact for generic BAdIs, BO interfaces, process blueprints, and fallback content.'),
  artifactType: z.string().min(1).optional().describe('Required for generic artifacts, for example BADI.'),
  version: z.string().min(1).optional().describe('Optional event version/release or spec version when the API Hub endpoint supports it.')
};

export const ResourcesInputSchema = {
  id: z.string().min(1).describe('Artifact ID.'),
  kind: ResourceKindSchema.describe('Resource kind.'),
  artifactType: z.string().min(1).optional().describe('Required for generic artifacts, for example BADI.'),
  version: z.string().min(1).optional().describe('Optional event version/release or spec version when the API Hub endpoint supports it.')
};

export const SpecInputSchema = {
  id: z.string().min(1).describe('Artifact ID.'),
  kind: SpecKindSchema.describe('Spec kind.'),
  format: SpecFormatSchema.describe('Requested format. APIs support json, yaml, edmx. Events support json, yaml. CDS Views support json. Generic artifacts support raw.'),
  artifactType: z.string().min(1).optional().describe('Required for generic artifacts, for example BADI.'),
  version: z.string().min(1).optional().describe('Optional event version/release or spec version when the API Hub endpoint supports it.')
};

export const DataProductListInputSchema = {
  q: z.string().min(1).max(200).optional().describe('Optional case-insensitive text matched against name, title, descriptions, ORD ID, business objects, and products.'),
  product: z.string().min(1).max(100).optional().describe('Optional product filter, for example SAPSuccessFactors.'),
  state: z.string().min(1).max(40).optional().describe('Optional lifecycle-state filter, for example ACTIVE.'),
  top: z.number().int().min(1).max(200).default(50).describe('Maximum matching data products to return.'),
  skip: z.number().int().min(0).default(0).describe('Number of matching data products to skip.')
};

export const DataProductGetInputSchema = {
  id: z.string().min(1).describe('Data-product technical name or exact ORD ID.')
};

export const PackageInputSchema = {
  id: z.string().min(1).describe('API Hub package/content package ID, for example C4C.'),
  includeArtifacts: z.boolean().default(true).describe('When true, also return package artifacts grouped by type/subtype.'),
  top: z.number().int().min(1).max(200).default(50).describe('Maximum number of package artifacts to return.')
};
