import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../taichung-electorate.js',import.meta.url),'utf8');
const {districtSeries,leaders,ordered}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const {elections}=JSON.parse(fs.readFileSync(new URL('../data/taichung-elections.json',import.meta.url)));
assert.equal(elections.length,8);
assert.deepEqual(elections.map(e=>e.date),elections.map(e=>e.date).sort());
for(const e of elections){
 assert.equal(Object.keys(e.districts).length,29);
 for(const a of [e.total,...Object.values(e.districts)]){
 assert.equal(a.candidates.reduce((n,c)=>n+c.votes,0),a.valid);assert.equal(a.valid+a.invalid,a.cast);assert(a.cast<=a.electors);
 assert.equal(ordered(a)[0].party,'民主進步黨');assert.equal(ordered(a)[1].party,'中國國民黨');}
 for(const field of ['valid','invalid','cast','electors'])assert.equal(Object.values(e.districts).reduce((n,a)=>n+a[field],0),e.total[field]);
}
const rows=leaders(elections);assert.equal(rows.length,29);assert(rows.every(r=>r.results.length===4));
for(const r of rows){assert.equal(districtSeries(elections,r.name).length,8);assert.equal(districtSeries(elections,r.name,'mayor').length,4);assert.equal(districtSeries(elections,r.name,'president').length,4);}
const y22=elections.find(e=>e.year===2022),y24=elections.at(-1),vote=(a,n)=>a.candidates.find(c=>c.name===n).votes;
assert(Object.values(y22.districts).every(a=>a.candidates.reduce((a,b)=>a.votes>b.votes?a:b).name==='盧秀燕'));
assert.equal(vote(y24.total,'柯文哲'),513025);assert.equal(vote(y24.total,'侯友宜')-vote(y24.total,'柯文哲'),39531);
assert.equal(vote(y24.districts['太平區'],'侯友宜')-vote(y24.districts['太平區'],'柯文哲'),5);
assert.equal(vote(y24.districts['大甲區'],'柯文哲')-vote(y24.districts['大甲區'],'侯友宜'),15);
assert.equal(Object.values(y24.districts).filter(a=>vote(a,'柯文哲')>vote(a,'侯友宜')).length,8);
assert.equal(Object.values(y24.districts).filter(a=>a.candidates.reduce((a,b)=>a.votes>b.votes?a:b).name==='賴清德').length,25);
console.log('PASS: 8 elections, 29 districts, vote conservation, fixed party order, citywide mayor lead, 5/15-vote margins');
