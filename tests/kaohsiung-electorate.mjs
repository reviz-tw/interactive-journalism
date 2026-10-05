import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../kaohsiung-electorate.js',import.meta.url),'utf8');
const {districtSeries,leaders,ordered}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const data=JSON.parse(fs.readFileSync(new URL('../data/kaohsiung-elections.json',import.meta.url)));
assert.equal(data.elections.length,9);
assert.deepEqual(data.elections.map(e=>e.date),data.elections.map(e=>e.date).sort());
assert.equal(data.elections.filter(e=>e.year===2020).length,2);
assert.equal(data.elections.at(-1).districts,undefined);
for(const e of data.elections){
 assert.equal(e.errors.length,0);
 for(const a of [e.total,...Object.values(e.districts||{})]){
  assert.equal(a.candidates.reduce((sum,c)=>sum+c.votes,0),a.valid);
  assert.equal(a.valid+a.invalid,a.cast);assert(a.cast<=a.electors);
  const cs=ordered(a);assert.equal(cs[0].party,'民主進步黨');assert.equal(cs[1].party,'中國國民黨');
 }
 if(e.districts){assert.equal(Object.keys(e.districts).length,38);for(const field of ['valid','cast','electors'])assert.equal(Object.values(e.districts).reduce((sum,a)=>sum+a[field],0),e.total[field]);}
}
const rows=leaders(data.elections);assert.equal(rows.length,38);assert.equal(rows.filter(r=>new Set(r.results.map(x=>x.winner.party)).size>1).length,25);
for(const {name} of rows){assert.equal(districtSeries(data.elections,name).length,8);assert.equal(districtSeries(data.elections,name,'mayor').length,5);assert.equal(districtSeries(data.elections,name,'president').length,3);}
assert.equal(districtSeries(data.elections,'不存在').length,0);
assert.equal(data.recall.yes+data.recall.no,data.recall.valid);
assert.equal(data.recall.valid+data.recall.invalid,data.recall.cast);
assert.equal(data.elections.find(e=>e.id==='2018 高雄市長').total.candidates.find(c=>c.name==='韓國瑜').votes,892545);
console.log('Kaohsiung vote conservation, geography exclusion, 38 district histories, ordering and recall: passed');
