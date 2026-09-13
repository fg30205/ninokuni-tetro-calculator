import fs from 'node:fs';

const catalog=JSON.parse(fs.readFileSync(new URL('../dist/data/puzzles.json',import.meta.url),'utf8'));
const puzzle=catalog.puzzles.find(p=>p.name_zh==='鸚鵡');
const shapes=[
 ['I',[[0,0],[0,1],[0,2],[0,3]]],['O',[[0,0],[1,0],[0,1],[1,1]]],
 ['T',[[0,0],[1,0],[2,0],[1,1]]],['L',[[0,0],[0,1],[0,2],[1,2]]],
 ['J',[[1,0],[1,1],[0,2],[1,2]]],['S',[[1,0],[2,0],[0,1],[1,1]]],
 ['Z',[[0,0],[1,0],[1,1],[2,1]]]
];
const norm=c=>{const x=Math.min(...c.map(v=>v[0])),y=Math.min(...c.map(v=>v[1]));return c.map(([a,b])=>[a-x,b-y]).sort((a,b)=>a[1]-b[1]||a[0]-b[0])};
const variants=c=>{const out=new Map();for(let r=0;r<4;r++){let v=c.map(([x,y])=>{for(let i=0;i<r;i++)[x,y]=[-y,x];return[x,y]});v=norm(v);out.set(JSON.stringify(v),v)}return[...out.values()]};
const pieces=shapes.map(([name,cells])=>({name,variants:variants(cells)}));
const mask=puzzle.rows.join('').split('').map(x=>x==='1'),filled=Array(81).fill(false);let best=-1;
function placements(target){const y=Math.floor(target/9),x=target%9,out=[];for(const piece of pieces)for(const v of piece.variants)for(const anchor of v){const ox=x-anchor[0],oy=y-anchor[1],cells=[];let ok=true;for(const [dx,dy]of v){const xx=ox+dx,yy=oy+dy,k=yy*9+xx;if(xx<0||yy<0||xx>=9||yy>=9||!mask[k]||filled[k]){ok=false;break}cells.push(k)}if(ok)out.push({name:piece.name,cells})}return out.sort((a,b)=>(b.name==='I')-(a.name==='I'))}
function search(covered,defense){if(defense+(puzzle.active_cells-covered)/4<=best)return;if(covered===puzzle.active_cells){best=defense;return}let choices=null;for(let k=0;k<81;k++)if(mask[k]&&!filled[k]){const p=placements(k);if(!p.length)return;if(!choices||p.length<choices.length)choices=p}for(const p of choices){p.cells.forEach(k=>filled[k]=true);search(covered+4,defense+(p.name==='I'));p.cells.forEach(k=>filled[k]=false)}}
search(0,0);
if(best!==6)throw new Error(`鸚鵡防禦回歸失敗：預期 6，實際 ${best}`);
console.log('鸚鵡最高防禦：6（通過）');
