// Export a reviewable source snapshot without modifying this checkout or its Site.
import { readdirSync, readFileSync, lstatSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--out' || !args[1].endsWith('.zip')) throw new Error('Usage: node scripts/package-github.mjs --out <output.zip>');
const out = resolve(args[1]);
const directories = ['app','build','components','db','drizzle','hooks','lib','public','scripts','tests','vendor','.github'];
const topFiles = ['.env.example','.gitignore','.npmrc','cloudflare-env.d.ts','components.json','drizzle.config.ts','eslint.config.mjs','next.config.ts','package-lock.json','package.json','postcss.config.mjs','tsconfig.json','vite.config.ts'];
const docs = ['GITHUB-README.md','GITHUB-RELEASE.md','ASSET-RIGHTS.md','SUNSET-ASSET.md'];
const textExtensions = new Set(['.ts','.tsx','.mts','.mjs','.js','.css','.json','.md','.sh','.yml','.yaml','.svg','.sql','.d.ts']);
const safeExtensions = new Set([...textExtensions,'.png','.LICENSE']);
const files = new Map();
const forbidden = /(?:^|\/)(?:node_modules|\.git|\.sites-runtime|\.wrangler|\.agents|\.codex|dist|work|outputs|coverage|\.next)(?:\/|$)|(?:^|\/)\.env(?!\.example$)|\.(?:pem|key|sqlite|db|log)$/i;
function add(name) {
  if (forbidden.test(name)) throw new Error(`Forbidden package path: ${name}`);
  const path = resolve(root,name);
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) throw new Error(`Symlink not allowed: ${name}`);
  if (stat.isDirectory()) { for (const entry of readdirSync(path).sort()) add(`${name}/${entry}`); return; }
  if (!topFiles.includes(name) && !safeExtensions.has(extname(name))) throw new Error(`Unexpected source extension: ${name}`);
  files.set(name, readFileSync(path));
}
for (const entry of [...directories,...topFiles,...docs.map(x=>`docs/${x}`)]) add(entry);
files.set('README.md',readFileSync(resolve(root,'docs/GITHUB-README.md')));
files.set('AGENTS.md',Buffer.from('Read README.md and docs/GITHUB-RELEASE.md before changes. Preserve accessible 3D navigation, reduced motion, safe PC instructions and truthful saved-guide/AI distinctions. Keep credentials server-side. Authorize every server route and use the authenticated identity for storage. Preserve npm lockfile. Run TypeScript, all tests and production build. The exported hosting config is local-only; never overwrite an existing owner Site identity.\n'));
files.set('.openai/hosting.json',Buffer.from(JSON.stringify({d1:'DB',r2:null},null,2)+'\n'));
// Fail closed on common credential formats and owner-local paths; report paths only.
const patterns=[/\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/,/gh[pousr]_[A-Za-z0-9]{20,}/,/github_pat_[A-Za-z0-9_]{20,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/AKIA[A-Z0-9]{16}/,/appgprj_[a-zA-Z0-9]+/,/[A-Za-z]:[\\/]Users[\\/][^\s]+/];
for(const [name,data] of files) if (extname(name)!=='.png' && patterns.some(p=>p.test(data.toString('utf8')))) throw new Error(`Review sensitive content in ${name}; archive not written.`);
const manifest=[...files].sort(([a],[b])=>a.localeCompare(b)).map(([name,data])=>({path:name,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')}));
files.set('SOURCE-MANIFEST.json',Buffer.from(JSON.stringify({format:1,description:'Source-only review package; no Git history or production Site identity',files:manifest},null,2)+'\n'));
// Standards-compliant uncompressed ZIP, UTF-8 filenames, fixed timestamps.
function crc32(data){let crc=0xffffffff;for(const byte of data){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
const local=[],central=[];let offset=0;
for(const [name,data] of [...files].sort(([a],[b])=>a.localeCompare(b))){
 const filename=Buffer.from(`benchmate/${name}`);const crc=crc32(data);const header=Buffer.alloc(30);
 header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(33,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(data.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(filename.length,26);
 local.push(header,filename,data);const directory=Buffer.alloc(46);directory.writeUInt32LE(0x02014b50);directory.writeUInt16LE(20,4);directory.writeUInt16LE(20,6);directory.writeUInt16LE(0x800,8);directory.writeUInt16LE(33,14);directory.writeUInt32LE(crc,16);directory.writeUInt32LE(data.length,20);directory.writeUInt32LE(data.length,24);directory.writeUInt16LE(filename.length,28);directory.writeUInt32LE(offset,42);central.push(directory,filename);offset+=header.length+filename.length+data.length;
}
const index=Buffer.concat(central);const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.size,8);end.writeUInt16LE(files.size,10);end.writeUInt32LE(index.length,12);end.writeUInt32LE(offset,16);
const zip=Buffer.concat([...local,index,end]);mkdirSync(dirname(out),{recursive:true});writeFileSync(out,zip,{flag:'wx'});writeFileSync(`${out}.sha256`,`${createHash('sha256').update(zip).digest('hex')}  ${out.split(/[\\/]/).pop()}\n`,{flag:'wx'});
console.log(`Packaged ${files.size} files (${zip.length} bytes). SHA-256 sidecar created.`);


