import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, posix } from 'node:path';
import { runInNewContext } from 'node:vm';
import { buildRelease, RELEASE_ASSETS } from '../scripts/build-release.mjs';

const source = { commit: 'a'.repeat(40), dirty: false };
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'steptrace-release-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceDirectory = join(root, 'dist');
  const outputDirectory = join(root, 'public');
  await cp(new URL('../dist/', import.meta.url), sourceDirectory, { recursive: true });
  return { root, sourceDirectory, outputDirectory, source };
}

async function pathsWithin(root, prefix = '') {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isDirectory()) files.push(...await pathsWithin(join(root, entry.name), `${prefix}${entry.name}/`));
    else files.push(`${prefix}${entry.name}`);
  }
  return files.sort();
}

test('A release contains only public shell assets, headers and truthful integrity metadata', async t => {
  const options = await fixture(t);
  await writeFile(join(options.sourceDirectory, '.env'), 'fictional-secret-marker');
  await writeFile(join(options.sourceDirectory, 'private-fixture.json'), '{"fictional":true}');
  const metadata = await buildRelease(options);
  assert.deepEqual(await pathsWithin(options.outputDirectory), [...RELEASE_ASSETS, '_headers', 'release.json'].sort());
  assert.deepEqual(metadata.source, source);
  assert.equal(metadata.hosting.basePath, '/');
  assert.equal(metadata.hosting.requiresHttps, true);
  assert.deepEqual(JSON.parse(await readFile(join(options.outputDirectory, 'release.json'), 'utf8')), metadata);
  const overall = createHash('sha256');
  for (const file of metadata.files) {
    const bytes = await readFile(join(options.outputDirectory, file.path));
    assert.equal(file.bytes, bytes.length, file.path);
    assert.equal(file.sha256, createHash('sha256').update(bytes).digest('hex'), file.path);
    overall.update(file.path).update('\0').update(bytes).update('\0');
  }
  assert.equal(metadata.artifactSha256, overall.digest('hex'));
  const headers = await readFile(join(options.outputDirectory, '_headers'), 'utf8');
  assert.match(headers, /Content-Security-Policy: default-src 'self'/);
  assert.match(headers, /form-action 'none'/);
  assert.match(headers, /\/sw.js\n  Cache-Control: no-cache/);
});

test('Built worker has the local server revision, a complete static shell, and stable rebuilds', async t => {
  const options = await fixture(t);
  const metadata = await buildRelease(options);
  const expectedHash = createHash('sha256');
  for (const asset of RELEASE_ASSETS) {
    expectedHash.update(asset).update(await readFile(join(options.sourceDirectory, asset)));
  }
  assert.equal(metadata.shellRevision, expectedHash.digest('hex').slice(0, 24));
  const worker = await readFile(join(options.outputDirectory, 'sw.js'), 'utf8');
  assert.ok(!worker.includes('__STEPTRACE_SHELL_REVISION__'));
  assert.ok(worker.includes(`const CACHE_NAME = 'steptrace-shell-${metadata.shellRevision}';`));
  const harness = { self: { addEventListener() {} } };
  runInNewContext(`${worker}\nglobalThis.shellAssets = ASSETS;`, harness);
  for (const path of harness.shellAssets) {
    assert.ok(RELEASE_ASSETS.includes(path === '/' ? 'index.html' : path.slice(1)), path);
    assert.ok((await readFile(join(options.outputDirectory, path === '/' ? 'index.html' : path.slice(1)))).length, path);
  }
  for (const asset of RELEASE_ASSETS.filter(path => path.endsWith('.js'))) {
    const script = await readFile(join(options.outputDirectory, asset), 'utf8');
    for (const [, imported] of script.matchAll(/(?:from\s*|import\s*\(?\s*)['"](\.[^'"]+)['"]/g)) {
      const target = posix.normalize(posix.join(posix.dirname(asset), imported));
      assert.ok(RELEASE_ASSETS.includes(target), `${asset} imports omitted asset ${target}`);
    }
  }
  assert.deepEqual(await buildRelease(options), metadata, 'An unchanged tree has a reproducible artifact with no generated timestamp');
  assert.match(await readFile(join(options.sourceDirectory, 'sw.js'), 'utf8'), /__STEPTRACE_SHELL_REVISION__/, 'Authored files stay untouched');
});

test('Any changed public asset changes the immutable cache revision and integrity', async t => {
  const options = await fixture(t);
  const before = await buildRelease(options);
  await writeFile(join(options.sourceDirectory, 'styles.css'), '/* Fictional release revision change */');
  const after = await buildRelease({ ...options, source: { ...source, dirty: true } });
  assert.notEqual(after.shellRevision, before.shellRevision);
  assert.notEqual(after.artifactSha256, before.artifactSha256);
  assert.equal(after.source.dirty, true);
});

test('Release builds reject incomplete or unversionable shells before writing output', async t => {
  const options = await fixture(t);
  await writeFile(join(options.sourceDirectory, 'sw.js'), '/* Missing the required revision marker */');
  await assert.rejects(buildRelease(options), /exactly one shell revision marker/);
  await assert.rejects(readFile(join(options.outputDirectory, 'index.html')), { code: 'ENOENT' });
  await rm(join(options.sourceDirectory, 'src/model.js'));
  await assert.rejects(buildRelease(options), { code: 'ENOENT' });
  await assert.rejects(buildRelease({ ...options, source: { commit: 'guessed', dirty: false } }), /full source commit/);
});

test('Rebuilding never overwrites unrelated files, follows symlinks, or writes into authored source', async t => {
  const options = await fixture(t);
  await mkdir(options.outputDirectory);
  await writeFile(join(options.outputDirectory, 'notes.txt'), 'Keep this unrelated work.');
  await assert.rejects(buildRelease(options), /without StepTrace release metadata/);
  assert.equal(await readFile(join(options.outputDirectory, 'notes.txt'), 'utf8'), 'Keep this unrelated work.');
  await rm(options.outputDirectory, { recursive: true });
  await buildRelease(options);
  await writeFile(join(options.outputDirectory, 'notes.txt'), 'Keep this new unrelated work.');
  await assert.rejects(buildRelease(options), /unrelated file or symlink: notes.txt/);
  assert.equal(await readFile(join(options.outputDirectory, 'notes.txt'), 'utf8'), 'Keep this new unrelated work.');
  await rm(join(options.outputDirectory, 'notes.txt'));
  await rm(join(options.outputDirectory, 'styles.css'));
  await symlink(join(options.sourceDirectory, 'styles.css'), join(options.outputDirectory, 'styles.css'));
  await assert.rejects(buildRelease(options), /unrelated file or symlink: styles.css/);
  await assert.rejects(buildRelease({ ...options, outputDirectory: options.sourceDirectory }), /separate from the authored source/);
  await assert.rejects(buildRelease({ ...options, outputDirectory: join(options.sourceDirectory, 'release') }), /separate from the authored source/);
  await assert.rejects(buildRelease({ ...options, outputDirectory: options.root }), /separate from the authored source/);
});
