import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../mountain-turnout.js',import.meta.url),'utf8');
const {roundStats,townStats,sizeGroups,ordered,winner}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const data=JSON.parse(fs.readFileSync(new URL('../data/mountain-turnout.json',import.meta.url)));
assert.equal(data.elections.length,10);assert.equal(data.towns.length,30);
assert.equal(new Set(data.towns.map(t=>t.county+t.name)).size,30);
for(const t of data.towns){
 assert.equal(t.results.length,10);assert.deepEqual(t.results.map(r=>r.election),data.elections.map(e=>e.id));
 for(const r of t.results){
  assert.equal(r.candidates.reduce((n,c)=>n+c.votes,0),r.valid);assert.equal(r.valid+r.invalid,r.cast);assert(r.cast<=r.electors);
  assert(Math.abs(r.turnout-100*r.cast/r.electors)<1e-3);assert(Math.abs(r.countyTurnout-100*r.countyCast/r.countyElectors)<1e-3);assert(Math.abs(r.gap-(r.turnout-r.countyTurnout))<1e-3);
  assert(r.countyElectors>r.electors);const o=ordered(r);assert.equal(o.length,r.candidates.length);
 }
}
const stats=roundStats(data);
assert.deepEqual(stats.map(s=>s.mean>0),data.elections.map(e=>e.kind==='local'));
assert.deepEqual(stats.map(s=>s.above),[26,5,25,3,29,8,29,9,28,9]);
assert.equal(stats[8].mean.toFixed(2),'14.53');assert.equal(stats[9].mean.toFixed(2),'-3.51');
const ml=data.towns.find(t=>t.stem==='茂林');
assert.equal(ml.results[6].turnout.toFixed(2),'91.65');assert.equal(winner(ml.results[6]).name,'韓國瑜');assert.equal(winner(ml.results[6]).share.toFixed(2),'91.83');
assert.equal(ml.results[8].turnout.toFixed(2),'90.84');assert.equal(ml.results[8].countyTurnout.toFixed(2),'58.61');
const all=data.towns.flatMap(t=>t.results.map(r=>({t,r})));const max=all.reduce((a,b)=>a.r.gap>b.r.gap?a:b),min=all.reduce((a,b)=>a.r.gap<b.r.gap?a:b);
assert.equal(max.t.stem,'茂林');assert.equal(max.r.election,'2022 縣市長');assert.equal(min.t.stem,'蘭嶼');assert.equal(min.r.election,'2024 總統');
assert(data.towns.find(t=>t.stem==='蘭嶼').results.every(r=>r.gap<0));
assert(data.towns.find(t=>t.stem==='金峰').results.filter(r=>r.kind==='president').every(r=>r.gap>0));
assert.equal(data.towns.find(t=>t.stem==='那瑪夏').results[0].townThen,'三民鄉');
const g=sizeGroups(data);assert.equal(g.small.local.toFixed(1),'16.2');assert.equal(g.large.local.toFixed(1),'7.3');assert.equal(g.large.president.toFixed(1),'-6.1');
const five=['烏來','和平','茂林','桃源','那瑪夏'].map(s=>data.towns.find(t=>t.stem===s));const avg=i=>five.reduce((n,t)=>n+t.results[i].gap,0)/5;
assert.equal(avg(0).toFixed(1),'16.1');assert.equal(avg(2).toFixed(1),'8.4');assert.equal(avg(4).toFixed(1),'18.1');assert(five.every(t=>t.results[2].year===2010));
assert.equal(data.towns.find(t=>t.stem==='復興').results[2].year,2009);
for(const i of [1,3,7,9])assert(data.towns.every(t=>winner(t.results[i]).party==='中國國民黨'));
assert.deepEqual(data.towns.filter(t=>winner(t.results[5]).party!=='中國國民黨').map(t=>t.stem).sort(),['五峰','烏來','蘭嶼'].sort());
console.log('PASS: 30 townships × 10 elections, conservation, county gaps, round summaries, Maolin/Lanyu extremes, size groups, 2010 district-head comparison');
