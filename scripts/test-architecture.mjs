import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function files(path) {
  try {
    return (await readdir(path, { withFileTypes: true })).flatMap(entry =>
      entry.isDirectory() ? files(join(path, entry.name)) : entry.name.endsWith('.ts') ? [join(path, entry.name)] : []);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

const violations = [];
for (const source of await files('src/domain')) {
  if (/from\s+['"][^'"]*(?:platform|entrypoints)\//.test(await readFile(source, 'utf8'))) violations.push(source);
}
if (violations.length) throw new Error(`domain imports outside its layer: ${violations.join(', ')}`);
console.log('Architecture boundaries verified.');
