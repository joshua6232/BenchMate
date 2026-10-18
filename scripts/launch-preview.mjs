import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const address = 'http://127.0.0.1:5173/';
process.chdir(root);

async function check() {
  try {
    const response = await fetch(address, { signal: AbortSignal.timeout(4000), redirect: 'manual' });
    const html = await response.text();
    if (response.ok && /<title>[^<]*Benchmate/i.test(html)) return 'ready';
    return 'occupied';
  } catch { return 'unavailable'; }
}

function openBrowser() {
  console.log(`Benchmate is ready: ${address}`);
  const browser = spawn('explorer.exe', [address], { windowsHide: true, stdio: 'ignore' });
  browser.on('error', () => console.log(`Open this address in your browser: ${address}`));
  browser.unref();
}

async function main() {
  const state = await check();
  if (process.argv.includes('--check')) {
    console.log(`Preview status: ${state}`);
    process.exitCode = state === 'ready' ? 0 : 1;
    return;
  }
  if (state === 'ready') {
    console.log('Your saved site is already running. Reusing it.');
    openBrowser();
    return;
  }
  if (state === 'occupied') throw new Error('Port 5173 is responding, but not with Benchmate. No other program was stopped. Show this message to Codex.');
  if (!existsSync('node_modules/vinext/dist/cli.js')) throw new Error('Website dependencies are missing. Ask Codex to restore them. Your project files are still saved.');
  console.log('Starting Benchmate. The browser will open once it is ready.');
  console.log('Keep this window open. Closing it stops the preview, not your saved project.');
  const server = spawn(process.execPath, ['scripts/run-framework.mjs', 'dev'], { cwd: root, stdio: 'inherit', windowsHide: true });
  let ended = false;
  let failure;
  server.on('error', error => { failure = error; ended = true; });
  server.on('exit', code => { ended = true; if (code) process.exitCode = code; });
  const stop = () => { if (!ended) server.kill(); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  process.once('exit', stop);
  for (let attempt = 0; attempt < 60; attempt++) {
    if (ended) throw new Error(failure?.message ?? 'The preview stopped during startup. Keep the error above and show it to Codex.');
    if (await check() === 'ready') { openBrowser(); return; }
    await delay(1000);
  }
  stop();
  throw new Error('The preview did not become ready in time. Show the messages above to Codex. Nothing was deleted.');
}
main().catch(error => { console.error(`\n${error.message}`); process.exitCode = 1; });
