import fs from 'node:fs';

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('Usage: node tools/extract-presets.mjs <saved-page.html>');
const html = fs.readFileSync(sourcePath, 'utf8');

const presetStart = html.indexOf('const presets = [');
const presetEnd = html.indexOf('\n];\nclass SVG', presetStart);
if (presetStart < 0 || presetEnd < 0) throw new Error('Preset block not found');
const presetSource = html.slice(presetStart, presetEnd);

const namesZh = [];
const selectMatch = html.match(/<select id="_select_puzzle_name">([\s\S]*?)<\/select>/);
if (selectMatch) {
  for (const option of selectMatch[1].matchAll(/<option[^>]*>([\s\S]*?)<\/option>/g)) {
    namesZh.push(option[1].replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, '').trim());
  }
}

const puzzles = [];
const entryRe = /\[\s*"([^"]+)",\s*Tetro\.binsToTetro\(\[([\s\S]*?)\]\)\s*\]/g;
for (const match of presetSource.matchAll(entryRe)) {
  const rows = [...match[2].matchAll(/0b([01]{1,9})/g)].map(row => row[1].padStart(9, '0'));
  if (rows.length !== 9) throw new Error(`Invalid row count for ${match[1]}`);
  const index = puzzles.length;
  puzzles.push({
    id: `p${String(index + 1).padStart(3, '0')}`,
    index,
    name_ko: match[1],
    name_zh: namesZh[index] || match[1],
    width: 9,
    height: 9,
    rows,
    active_cells: rows.reduce((sum, row) => sum + [...row].filter(bit => bit === '1').length, 0)
  });
}

if (puzzles.length !== 94) throw new Error(`Expected 94 puzzles, found ${puzzles.length}`);
if (puzzles.some(p => p.active_cells % 4 !== 0)) throw new Error('A puzzle is not divisible into tetrominoes');

process.stdout.write(JSON.stringify({
  schema_version: 1,
  source: 'https://myar.tistory.com/39',
  extracted_at: new Date().toISOString(),
  puzzle_count: puzzles.length,
  puzzles
}, null, 2));
