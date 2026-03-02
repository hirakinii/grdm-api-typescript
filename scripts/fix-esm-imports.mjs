/**
 * Fix ESM import paths by adding .js extension to relative imports.
 *
 * TypeScript compiles imports without file extensions, but ESM requires
 * explicit .js extensions for relative imports. This script patches all
 * compiled .js files in dist/esm/ to add .js extensions.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, resolve, dirname } from 'path';

/**
 * Recursively fix relative imports in all .js files under the given directory.
 * @param {string} dir - Directory to process.
 */
function fixImports(dir) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      fixImports(fullPath);
    } else if (entry.endsWith('.js')) {
      let content = readFileSync(fullPath, 'utf8');

      // Add .js extension to relative imports/exports that lack an extension.
      // Matches: from './foo', from '../bar/baz', export * from './utils'
      const fixed = content.replace(
        /((?:import|export)[^'"]*['"])(\.{1,2}\/[^'"]*?)(["'])/g,
        (_match, prefix, importPath, suffix) => {
          if (extname(importPath) === '') {
            const resolvedPath = resolve(dirname(fullPath), importPath);
            if (existsSync(resolvedPath) && statSync(resolvedPath).isDirectory()) {
              return `${prefix}${importPath}/index.js${suffix}`;
            }
            return `${prefix}${importPath}.js${suffix}`;
          }
          return `${prefix}${importPath}${suffix}`;
        },
      );

      if (fixed !== content) {
        writeFileSync(fullPath, fixed, 'utf8');
        console.log(`Fixed: ${fullPath}`);
      }
    }
  }
}

fixImports('./dist/esm');
console.log('ESM import fix complete.');
