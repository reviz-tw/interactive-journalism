import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../tainan-electorate.js',import.meta.url),'utf8');
const {districtSeries,leaders,ordered}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const data=JSON.parse(fs.readFileSync(new URL('../data/tainan-elections.json',import.meta.url)));
assert.equal(data.elections.length,8);
assert.deepEqual(data.elections.map(e=>e.date),data.elections.map(e=>e.date).sort());
for(const e of data.elections){
 assert.equal(e.errors.length,0);assert.equal(Object.keys(e.districts).length,37);
 for(const a of [e.total,...Object.values(e.districts)]){
 assert.equal(a.candidates.reduce((n,c)=>n+c.votes,0),a.valid);assert.equal(a.valid+a.invalid,a.cast);assert(a.cast<=a.electors);
 assert.equal(ordered(a)[0].party,'民主進步黨');assert.equal(ordered(a)[1].party,'中國國民黨');}
 for(const field of ['valid','cast','electors'])assert.equal(Object.values(e.districts).reduce((n,a)=>n+a[field],0),e.total[field]);
}
const rows=leaders(data.elections);assert.equal(rows.length,37);assert(rows.every(r=>r.results.length===4));
for(const r of rows){assert.equal(districtSeries(data.elections,r.name).length,8);assert.equal(districtSeries(data.elections,r.name,'mayor').length,4);assert.equal(districtSeries(data.elections,r.name,'president').length,4);}
const y22=data.elections.find(e=>e.year===2022),yk=y22.districts['永康區'];assert.equal(yk.candidates.find(c=>c.name==='謝龍介').votes-yk.candidates.find(c=>c.name==='黃偉哲').votes,32);
const y18=data.elections.find(e=>e.year===2018);assert.equal(y18.total.candidates.length,6);assert.equal(y18.districts['龍崎區'].candidates.reduce((a,b)=>a.votes>b.votes?a:b).name,'陳永和');
assert.equal(data.elections.at(-1).districts['善化區'].candidates.find(c=>c.name==='柯文哲').votes>0,true);
console.log('PASS: Tainan 8 elections, 37 district histories, 32-vote margin, Longqi winner, fixed party order and conservation');
