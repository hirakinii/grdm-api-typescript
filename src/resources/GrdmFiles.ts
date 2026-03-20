import { Files } from 'osf-api-v2-typescript';

/**
 * GRDM-specific file listing resource.
 *
 * Extends the upstream Files class to provide subfolder navigation
 * via listByPath() and listByPathPaginated(), and serves as a dedicated
 * extension point for future GRDM-specific file operations.
 *
 * @example
 * ```typescript
 * const client = new GrdmClient({ token: 'your-token' });
 *
 * // List files inside a subfolder
 * const result = await client.grdmFiles.listByPath('abc12', 'osfstorage', '/xyz789/');
 *
 * // Paginate through all items in the subfolder
 * const paged = await client.grdmFiles.listByPathPaginated('abc12', 'osfstorage', '/xyz789/');
 * for await (const item of paged.items()) {
 *   console.log(item.name);
 * }
 * ```
 */
export class GrdmFiles extends Files {}
