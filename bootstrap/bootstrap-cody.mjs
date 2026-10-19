#!/usr/bin/env node
// Homebrew owns prerequisites; the deployed API alone selects the runtime.
import {execFileSync, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync} from 'node:fs';
import {homedir, tmpdir} from 'node:os';
import {join} from 'node:path';

const repository = 'liux4989/cody';
const authority = 'https://cody-communication.liux4989.workers.dev/api/chat/release';
const runtime = join(homedir(), '.local/share/cody/connector/current/src/cody.mjs');
const args = process.argv.slice(2);
const run = (command, argv, options = {}) => execFileSync(command, argv, {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options});
const fail = message => { throw new Error(message); };
const execute = (entry, argv) => {
  const result = spawnSync(process.execPath, [entry, ...argv], {stdio: 'inherit'});
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
};

let directory;
try {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 18))
    fail('Node.js 22.18+ is required. Run: brew upgrade node@22');
  if (existsSync(runtime)) {
    // The installed CLI enforces release authority, including stale-reader repair.
    execute(runtime, args);
  } else if (args[0] === '--help' || args[0] === '-h') {
    console.log('Cody bootstrap: run cody upgrade to install the API-authorized runtime.\nFor Pi: cody upgrade --configure pi');
  } else {
    if (args[0] !== 'upgrade') fail('Cody is not installed yet. Run: cody upgrade');
    if (args.includes('--check')) fail('No Cody runtime is installed. Run cody upgrade first; bootstrap does not install during --check.');
    for (const command of ['gh', 'tar']) {
      if (spawnSync('/usr/bin/which', [command]).status !== 0)
        fail(`Missing ${command}. Run brew reinstall liux4989/cody/cody to restore dependencies.`);
    }
    console.error('Checking GitHub access (credentials are never installed automatically)…');
    try { run('gh', ['api', `repos/${repository}`, '--hostname', 'github.com']); }
    catch { fail('Cannot read liux4989/cody. Run gh auth login --hostname github.com and confirm repository access, then retry cody upgrade.'); }

    console.error('Discovering the deployed Cody release…');
    const response = await fetch(authority, {signal: AbortSignal.timeout(30_000), redirect: 'error'});
    if (!response.ok) fail(`Release authority returned HTTP ${response.status}; no runtime was installed.`);
    const {tag} = await response.json();
    if (!/^v\d+\.\d+\.\d+$/.test(tag ?? '')) fail('Release authority returned no valid release tag.');
    const metadata = JSON.parse(run('gh', ['api', `repos/${repository}/releases/tags/${tag}`, '--hostname', 'github.com']));
    if (metadata.tag_name !== tag || metadata.draft || metadata.prerelease)
      fail(`Release ${tag} is not a published production release.`);
    const names = metadata.assets.map(asset => asset.name);
    if (new Set(names).size !== names.length || names.some(name => !/^[\w.-]+$/.test(name)))
      fail('Invalid or duplicate publication asset names.');
    if (!names.includes('SHA256SUMS')) fail('Publication checksums are missing.');
    const archives = names.filter(name => /^cody-connector-\d+\.\d+\.\d+\.tgz$/.test(name));
    if (archives.length !== 1) fail('Publication must contain exactly one connector archive.');
    directory = mkdtempSync(join(tmpdir(), 'cody-bootstrap-'));
    console.error(`Downloading and verifying ${tag}…`);
    run('gh', ['release', 'download', tag, '--repo', `https://github.com/${repository}`, '--dir', directory], {stdio: 'inherit'});
    const digest = name => createHash('sha256').update(readFileSync(join(directory, name))).digest('hex');
    for (const asset of metadata.assets) {
      if (asset.state !== 'uploaded' || asset.digest !== `sha256:${digest(asset.name)}`)
        fail(`GitHub publication digest mismatch: ${asset.name}`);
    }
    const lines = readFileSync(join(directory, 'SHA256SUMS'), 'utf8').trim().split('\n');
    if (lines.length !== names.length - 1) fail('Incomplete publication checksums.');
    for (const name of names.filter(name => name !== 'SHA256SUMS')) {
      if (lines.filter(line => line === `${digest(name)}  ${name}`).length !== 1)
        fail(`Publication checksum mismatch: ${name}`);
    }
    const archive = join(directory, archives[0]);
    const entries = run('tar', ['-tzf', archive]).trim().split('\n');
    if (!entries.length || entries.some(name => !name.startsWith('package/') ||
        name.split('/').slice(1).some(part => !part || part === '.' || part === '..')))
      fail('Connector archive contains an unsafe path.');
    if (run('tar', ['-tvzf', archive]).trim().split('\n').some(line => line[0] !== '-'))
      fail('Connector archive must contain only regular files.');
    const reader = join(directory, 'reader');
    mkdirSync(reader);
    run('tar', ['-xzf', archive, '-C', reader, '--strip-components=1', '--no-same-owner']);
    const entry = join(reader, 'src/cody.mjs');
    // The official reader verifies provenance/qualification and rechecks authority
    // before activation. Bootstrap checksums alone never authorize installation.
    run(process.execPath, [entry, 'upgrade', '--check'], {stdio: ['ignore', 'pipe', 'inherit']});
    execute(entry, args);
  }
} catch (error) {
  console.error(`Cody: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (directory) rmSync(directory, {recursive: true, force: true});
}
