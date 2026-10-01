import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const data=read('data/dual-city-voter-directions.json');
for(const key of ['taipei','new-taipei']){
 const es=read('data/'+key+'-elections.json').elections.filter(e=>e.year>=2014);
 assert.equal(data.cities[key].length,key==='taipei'?13:30);
 for(const row of data.cities[key]){
  assert.deepEqual(row.series.map(s=>s.year),es.map(e=>e.year));
  for(const s of row.series){
   const e=es.find(e=>e.year===s.year),vs=e.villages.filter(v=>row.district==='全市'||v.district===row.district);
   for(const f of ['valid','electors'])assert.equal(s[f],vs.reduce((n,v)=>n+v[f],0));
   assert.equal(s.turnout,100*vs.reduce((n,v)=>n+v.cast,0)/s.electors);
   for(const c of s.candidates){assert.equal(c.votes,vs.reduce((n,v)=>n+v.votes[c.number],0));assert.equal(c.share,100*c.votes/s.valid);}
   assert.equal(s.winner,s.candidates.reduce((a,b)=>a.votes>b.votes?a:b).name);
  }
 }
 const html=fs.readFileSync(new URL('../'+key+'-electorate.html',import.meta.url),'utf8');
 const section=html.split('<section id="political-style"')[1].split('</section>')[0];
 assert.equal((html.match(/id="political-style"/g)||[]).length,1);
 assert(html.includes('研究：選民的方向'));
 assert(!section.includes('政黨票為'));
 assert(section.includes('data/dual-city-voter-directions.json'));
 const focus=data.cities[key].find(r=>r.district===(key==='taipei'?'內湖區':'林口區'));
 for(const s of focus.series){assert(section.includes(s.turnout.toFixed(2)+'%'));assert(section.includes(s.winner));}
}
const winners=(key,d)=>data.cities[key].find(r=>r.district===d).series.map(s=>s.winner);
assert.deepEqual(winners('taipei','內湖區'),['柯文哲','蔡英文','柯文哲','蔡英文','蔣萬安','侯友宜']);
assert.deepEqual(winners('new-taipei','林口區'),['朱立倫','蔡英文','侯友宜','蔡英文','侯友宜','賴清德']);
assert.deepEqual(winners('new-taipei','蘆洲區'),['游錫堃','蔡英文','蘇貞昌','蔡英文','侯友宜','賴清德']);
console.log('PASS: 雙城 41 區及 2 個全市，2014–2024 票數、投票率、最高票軌跡與頁面敘述');
