import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../taipei-electorate.js',import.meta.url),'utf8');
const {regionSeries}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const data=JSON.parse(fs.readFileSync(new URL('../data/taipei-elections.json',import.meta.url)));
const geo=JSON.parse(fs.readFileSync(new URL('../data/taipei-villages.geojson',import.meta.url)));
assert.equal(data.elections.length,16);
let rowCount=0;
for(const e of data.elections){const keys=new Set();for(const v of e.villages){const k=v.district+'|'+v.name;assert(!keys.has(k));keys.add(k);assert.equal(Object.values(v.votes).reduce((a,b)=>a+b,0),v.valid);assert.equal(v.valid+v.invalid,v.cast);assert(v.cast<=v.electors);rowCount+=Object.keys(v.votes).length;}if(e.year>=2010){let gkeys=new Set(geo.features.map(f=>f.properties.district+'|'+f.properties.name));const unmatched=e.villages.filter(v=>!gkeys.has(v.district+'|'+v.name));assert.equal(unmatched.length,2);assert(unmatched.every(v=>v.district==='信義區'||v.district==='萬華區')); }}
assert.equal(rowCount,31044);
const e=data.elections.find(e=>e.id==='2024 總統');
const total=name=>e.villages.reduce((sum,v)=>sum+v.votes[e.candidates.find(c=>c.name===name).number],0);
assert.equal(total('賴清德')-total('侯友宜'),641);
console.log('PASS: 16 elections, 31,044 candidate rows, vote conservation, geography coverage, 641-vote baseline.');
const districtNames=[...new Set(e.villages.map(v=>v.district))];
for(const district of districtNames){const series=regionSeries(data.elections,district);assert.equal(series.length,16);assert(series.every(r=>!r.missing));for(const r of series){assert(r.turnout>=0&&r.turnout<=100);assert.equal(r.a.valid,r.a.candidates.reduce((a,c)=>a+c.votes,0));const expected=data.elections.find(x=>x.id===r.e.id).villages.filter(v=>v.district===district);assert.equal(r.a.electors,expected.reduce((a,v)=>a+v.electors,0));assert.equal(r.a.cast,expected.reduce((a,v)=>a+v.cast,0));}}
const ws=regionSeries(data.elections,'文山區','','總統');assert.equal(ws.length,8);assert.equal(ws.at(-1).winner.name,'侯友宜');assert(Math.abs(ws.at(-1).turnout-74.98289191388622)<1e-10);
const absent=regionSeries(data.elections,'中山區','','臺北市長').find(r=>r.e.year===2014);assert.equal(absent.dpp,null);assert.equal(absent.winner.name,'柯文哲');
const missing=regionSeries(data.elections,'中山區','不存在的里');assert(missing.every(r=>r.missing));
const vil=regionSeries(data.elections,'文山區','萬興里','總統');for(const r of vil.filter(r=>!r.missing))assert.equal(r.villageCount,1);
console.log('PASS: 12 districts × 16 regional aggregates, type filtering, village matching, missing names, 2014 absent party, local highest-vote candidate.');
