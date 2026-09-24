import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { access, lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const REVISION_MARKER = '__STEPTRACE_SHELL_REVISION__';
const FORMAT = 'steptrace-static-release';
export const RELEASE_ASSETS = Object.freeze([
  'index.html', 'workspace.html', 'preview.html', 'styles.css', 'landing.css', 'workspace-demo.jpg', 'sw.js',
  ...['bootstrap', 'app', 'demo', 'preview', 'model', 'storage', 'source-selection',
    'schema-v1', 'schema-v2', 'comparison', 'review-ui', 'dependencies',
    'dependency-ui', 'dependency-demo', 'drafts', 'offline'].map(name => `src/${name}.js`),
].sort());

// Understood by hosts with the Netlify/Cloudflare Pages _headers convention.
// Other static hosts must configure equivalent response headers themselves.
export const RELEASE_HEADERS = `/*
  Cache-Control: no-cache
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Content-Security-Policy: default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'
/sw.js
  Cache-Control: no-cache
  Service-Worker-Allowed: /
`;

const sha256 = content => createHash('sha256').update(content).digest('hex');

async function exists(path) {
  try { await access(path); return true; } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

export async function readGitSource(repository = ROOT) {
  // This Mac's system git can open an installer. Prefer its already available
  // bundled executable; CI and normal developer machines use git on PATH.
  const bundledGit = join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git');
  const git = process.env.STEPTRACE_GIT || (await exists(bundledGit) ? bundledGit : 'git');
  const run = args => execFileSync(git, ['-C', repository, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  return {
    commit: run(['rev-parse', '--verify', 'HEAD']),
    dirty: run(['status', '--porcelain', '--untracked-files=normal']) !== '',
  };
}

async function inspectOutput(outputDirectory) {
  if (!await exists(outputDirectory)) return;
  if (!(await lstat(outputDirectory)).isDirectory()) throw new Error('Release output must be a real directory, not a symlink or file.');
  const names = await readdir(outputDirectory);
  if (!names.length) return;
  const manifestPath = join(outputDirectory, 'release.json');
  if (!await exists(manifestPath) || !(await lstat(manifestPath)).isFile()) throw new Error('Refusing to overwrite a directory without StepTrace release metadata.');
  const previous = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (previous.format !== FORMAT || previous.schemaVersion !== 1) throw new Error('Refusing to overwrite an unrecognized release directory.');
  const allowed = new Set([...RELEASE_ASSETS, '_headers', 'release.json']);
  async function visit(folder, prefix = '') {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const path = `${prefix}${entry.name}`;
      if (entry.isDirectory() && path === 'src') await visit(join(folder, entry.name), 'src/');
      else if (!entry.isFile() || !allowed.has(path)) throw new Error(`Release output contains an unrelated file or symlink: ${path}`);
    }
  }
  await visit(outputDirectory);
}

export async function buildRelease({
  sourceDirectory = join(ROOT, 'dist'),
  outputDirectory = join(ROOT, 'work/release'),
  source,
} = {}) {
  sourceDirectory = resolve(sourceDirectory);
  outputDirectory = resolve(outputDirectory);
  const relation = relative(outputDirectory, sourceDirectory);
  const inverse = relative(sourceDirectory, outputDirectory);
  const isInside = path => path !== '' && !path.startsWith('..') && !path.startsWith('/');
  if (!relation || isInside(relation) || isInside(inverse)) throw new Error('Release output must be separate from the authored source directory.');
  source ??= await readGitSource();
  if (!/^[a-f\d]{40,64}$/i.test(source.commit) || typeof source.dirty !== 'boolean') throw new Error('A full source commit and truthful dirty status are required.');
  await inspectOutput(outputDirectory);

  const files = new Map();
  const shellHash = createHash('sha256');
  for (const path of RELEASE_ASSETS) {
    const file = join(sourceDirectory, path);
    if (!(await lstat(file)).isFile()) throw new Error(`Release asset must be a regular file: ${path}`);
    const content = await readFile(file);
    files.set(path, content);
    // This is intentionally the same sorted-path/bytes algorithm as serve.mjs.
    shellHash.update(path);
    shellHash.update(content);
  }
  const shellRevision = shellHash.digest('hex').slice(0, 24);
  const worker = files.get('sw.js').toString('utf8');
  if (worker.split(REVISION_MARKER).length !== 2) throw new Error('The authored worker must contain exactly one shell revision marker.');
  files.set('sw.js', Buffer.from(worker.replace(REVISION_MARKER, shellRevision)));
  files.set('_headers', Buffer.from(RELEASE_HEADERS));

  const integrity = [];
  const artifactHash = createHash('sha256');
  for (const [path, content] of [...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    integrity.push({ path, bytes: content.length, sha256: sha256(content) });
    artifactHash.update(path).update('\0').update(content).update('\0');
  }
  const metadata = {
    format: FORMAT,
    schemaVersion: 1,
    source: { commit: source.commit, dirty: source.dirty },
    hosting: { basePath: '/', requiresHttps: true, headerConvention: 'Netlify / Cloudflare Pages _headers; configure equivalent headers on other hosts' },
    shellRevision,
    artifactSha256: artifactHash.digest('hex'),
    files: integrity,
  };
  // Only explicit public assets are copied. Repository notes, evaluation data,
  // tests, environment files, local backups and git metadata never enter here.
  for (const [path, content] of files) {
    const destination = join(outputDirectory, path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, content);
  }
  await writeFile(join(outputDirectory, 'release.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  return metadata;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length && (args.length !== 2 || args[0] !== '--out')) throw new Error('Usage: node scripts/build-release.mjs [--out directory]');
    const outputDirectory = resolve(args[1] || join(ROOT, 'work/release'));
    const metadata = await buildRelease({ outputDirectory });
    console.log(`Static release: ${outputDirectory}`);
    console.log(`Source: ${metadata.source.commit}${metadata.source.dirty ? ' (working tree has changes; rebuild from the release commit before publication)' : ''}`);
    console.log(`Artifact SHA-256: ${metadata.artifactSha256}`);
    console.log('Deploy the artifact at an HTTPS origin root. release.json records integrity; _headers requires compatible host support.');
  } catch (error) {
    console.error(`Release build failed: ${error.message}`);
    process.exitCode = 1;
  }
}
