import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const parties=read('data/dual-city-party-votes-2024.json');
const facts=read('data/dual-city-political-style.json');
for(const key of ['taipei','new-taipei']){
 const rows=parties.cities[key];
 for(const field of ['valid','kmt','dpp','tpp']) assert.equal(rows.slice(1).reduce((n,r)=>n+r[field],0),rows[0][field]);
 const elections=read('data/'+key+'-elections.json').elections;
 for(const r of facts.cities[key]) for(const [year,s] of Object.entries(r.elections)){
  const e=elections.find(e=>e.year===Number(year));
  const villages=e.villages.filter(v=>r.district==='全市'||v.district===r.district);
  for(const field of ['valid','electors','cast']) assert.equal(s[field],villages.reduce((n,v)=>n+v[field],0));
  for(const c of s.candidates){assert.equal(c.votes,villages.reduce((n,v)=>n+v.votes[c.number],0));assert.equal(c.share,100*c.votes/s.valid);}
 }
 const html=fs.readFileSync(new URL('../'+key+'-electorate.html',import.meta.url),'utf8');
 assert.equal((html.match(/id="political-style"/g)||[]).length,1);
 assert(html.includes('href="#political-style"'));
 const city=facts.cities[key][0]; const ko=city.elections['2024'].candidates.find(c=>c.name==='柯文哲');
 assert.equal((ko.share-100*city.party2024.tpp/city.party2024.valid).toFixed(2),key==='taipei'?'1.96':'3.35');
}
const lin=facts.cities['new-taipei'].find(r=>r.district==='林口區');
assert.equal(lin.elections['2024'].valid-lin.elections['2020'].valid,8735);
assert.equal(((lin.elections['2024'].electors/lin.elections['2020'].electors-1)*100).toFixed(2),'15.64');
assert.equal(lin.elections['2024'].candidates.find(c=>c.name==='賴清德').votes-lin.elections['2020'].candidates.find(c=>c.name==='蔡英文').votes,-9096);
console.log('雙城研究：原表重新加總、政黨票區市加總、頁面數值與來源界線通過');
