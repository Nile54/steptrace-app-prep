import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

// Exercise the real allowlisted HTTP server: a split landing/workspace must
// not strand old source links, omit shell assets, or expose repository files.
test('Public landing links reach the workspace and every authored resource is served', async t => {
  const child = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: new URL('../', import.meta.url), env: { ...process.env, PORT: '43184' }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => child.kill());
  let stderr = ''; child.stderr.on('data', bytes => { stderr += bytes; });
  await Promise.race([once(child.stdout, 'data'), once(child, 'exit').then(() => { throw new Error(stderr); })]);
  const base = 'http://127.0.0.1:43184';
  const home = await (await fetch(base)).text();
  assert.match(home, /See how it works/);
  assert.doesNotMatch(home, /<script/, 'Landing must not start the workspace or write storage');
  const workspace = await (await fetch(`${base}/workspace.html`)).text();
  assert.match(workspace, /id="source-snapshot"/);
  assert.match(workspace, /id="prepare-backup"/);
  assert.equal(await (await fetch(`${base}/workspace`)).text(), workspace);
  for (const [page, pageURL] of [[home, base], [workspace, `${base}/workspace.html`]]) {
    for (const [, value] of page.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(?:https:|data:)/.test(value)) continue;
      const url = new URL(value, pageURL);
      const response = await fetch(url);
      assert.equal(response.status, 200, value);
      if (url.hash) assert.match(await response.text(), new RegExp(`id="${url.hash.slice(1)}"`), value);
    }
  }
  assert.equal((await fetch(`${base}/workspace-demo.jpg`)).headers.get('content-type'), 'image/jpeg');
  for (const path of ['/docs/STATE.md', '/.git/config', '/work/backup.json', '/.env']) assert.equal((await fetch(base + path)).status, 404);
  assert.equal((await fetch(base, { method: 'POST', body: 'fictional instructions' })).status, 405);
});
