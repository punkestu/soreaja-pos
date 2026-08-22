import fs from 'fs';
const content = fs.readFileSync('src/lib/sync.ts', 'utf8');
console.log("Lines in performSyncUp around sheet creation:");
const lines = content.split('\n');
const upStart = lines.findIndex(l => l.includes('export async function performSyncUp'));
const upEnd = lines.findIndex((l, i) => i > upStart && l.includes('export async function'));
console.log(lines.slice(upStart, upStart + 150).filter(l => l.includes('sheet') || l.includes('fetch')).join('\n'));
