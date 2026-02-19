/**
 * Build UMD bundle using esbuild.
 *
 * Produces a browser-compatible IIFE bundle at dist/umd/grdm-api.min.js,
 * exposing the library as the global variable `GrdmApi`.
 */

import * as esbuild from 'esbuild';
import { mkdirSync } from 'fs';

mkdirSync('./dist/umd', { recursive: true });

await esbuild.build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  outfile: './dist/umd/grdm-api.min.js',
  format: 'iife',
  globalName: 'GrdmApi',
  minify: true,
  platform: 'browser',
  target: ['es2020'],
  sourcemap: true,
  external: [],
});

console.log('UMD build complete: dist/umd/grdm-api.min.js');
