import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';

test('compiled API runs in plain Node ESM without extension resolution hooks', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pokebinder-api-'));
  try {
    await writeFile(join(directory, 'package.json'), '{"type":"module"}');
    await symlink(resolve('node_modules'), join(directory, 'node_modules'), 'dir');
    // Do not bundle: preserve module boundaries like the failing production artifact.
    await build({ entryPoints: ['api/index.ts', 'server.ts', 'src/data/pokemonCards.ts', 'src/data/pokecollectorCatalog.ts'], outdir: directory, outbase: '.', platform: 'node', format: 'esm', bundle: false });
    await mkdir(join(directory, 'tests'));
    // Reuse HTTP assertions, but run against emitted JS with no tsx loader.
    const { readFile } = await import('node:fs/promises');
    const testSource = (await readFile('tests/api.test.ts', 'utf8'))
      .replace("'../api/index'", "'../api/index.js'");
    await build({ stdin: { contents: testSource, loader: 'ts', resolveDir: resolve('.') }, outfile: join(directory, 'tests/api.test.js'), platform: 'node', format: 'esm', bundle: false });
    const result = spawnSync(process.execPath, ['--test', join(directory, 'tests/api.test.js')], { encoding: 'utf8', env: { ...process.env, VERCEL: '1' } });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
