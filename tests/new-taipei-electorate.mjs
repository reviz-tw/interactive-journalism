import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../new-taipei-electorate.js',import.meta.url),'utf8');
const {regionSeries}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const data=JSON.parse(fs.readFileSync(new URL('../data/new-taipei-elections.json',import.meta.url)));
const geo=JSON.parse(fs.readFileSync(new URL('../data/new-taipei-villages.geojson',import.meta.url)));
assert.equal(data.elections.length,13);
assert.equal(data.elections.filter(e=>e.type==='總統').length,8);
assert.deepEqual(data.elections.filter(e=>e.type!=='總統').map(e=>e.year),[2005,2010,2014,2018,2022]);
const districts=[...new Set(data.elections.at(-1).villages.map(v=>v.district))];assert.equal(districts.length,29);
let rows=0;
for(const e of data.elections){
 const keys=new Set();
 for(const v of e.villages){const k=v.district+'|'+v.name;assert(!keys.has(k),k);keys.add(k);assert.equal(Object.values(v.votes).reduce((a,b)=>a+b,0),v.valid);assert.equal(v.valid+v.invalid,v.cast);assert(v.cast<=v.electors);assert.equal(Object.keys(v.votes).length,e.candidates.length);rows+=Object.keys(v.votes).length;}
 assert.equal(new Set(e.villages.map(v=>v.district)).size,29);
}
assert.equal(rows,40579);
const last=data.elections.at(-1),total=name=>last.villages.reduce((n,v)=>n+v.votes[last.candidates.find(c=>c.name===name).number],0);
assert.equal(total('賴清德'),948818);assert.equal(total('侯友宜'),864557);assert.equal(total('柯文哲'),645105);
const gkeys=new Set(geo.features.map(f=>f.properties.district+'|'+f.properties.name));assert.equal(gkeys.size,1032);
assert.equal(last.villages.filter(v=>gkeys.has(v.district+'|'+v.name)).length,1019);
for(const district of districts){
 const series=regionSeries(data.elections,district);assert.equal(series.length,13);assert(series.every(r=>!r.missing));
 for(const r of series){assert(r.turnout>=0&&r.turnout<=100);assert.equal(r.a.valid,r.a.candidates.reduce((n,c)=>n+c.votes,0));}
 assert.equal(regionSeries(data.elections,district,'','首長').length,5);
 assert.equal(regionSeries(data.elections,district,'','總統').length,8);
}
assert(regionSeries(data.elections,'板橋區','不存在的里').every(r=>r.missing));
assert.equal(regionSeries(data.elections,'板橋區','海山里','總統').length,8);
const stack=vm.runInNewContext(source.split('export function regionSeries')[0]+`;stack({valid:100,candidates:[{party:KMT,name:'藍',votes:55},{party:'其他',name:'他',votes:25},{party:DPP,name:'綠',votes:20}]})`);
assert(stack.indexOf('title="綠')<stack.indexOf('title="藍'));assert(stack.indexOf('title="藍')<stack.indexOf('title="他'));
console.log('PASS: 40,579 rows, 13 elections, 29 district histories, vote conservation, 2024 totals, geography coverage, county/mayor filters, fixed bar order.');
// Editorial claims use full-precision aggregates and district winners, never rounded shares.
const winners=year=>districts.map(d=>regionSeries(data.elections,d).find(r=>r.e.year===year).winner.name);
assert.equal(winners(2022).filter(n=>n==='侯友宜').length,29);
assert.equal(winners(2024).filter(n=>n==='侯友宜').length,10);
assert.equal(winners(2024).filter(n=>n==='賴清德').length,19);
assert.equal(winners(2014).filter(n=>n==='朱立倫').length,15);
assert.equal(winners(2014).filter(n=>n==='游錫堃').length,14);
for(const [year,expectedVotes,expectedMargin]of [[2014,24528,'1.28'],[2022,458579,'24.83']]){
 const e=data.elections.find(e=>e.year===year),vs=e.villages,valid=vs.reduce((n,v)=>n+v.valid,0),rank=e.candidates.map(c=>vs.reduce((n,v)=>n+v.votes[c.number],0)).sort((a,b)=>b-a);
 assert.equal(rank[0]-rank[1],expectedVotes);assert.equal((100*(rank[0]-rank[1])/valid).toFixed(2),expectedMargin);
}
console.log('PASS: narrative claims for 2014 narrow margin, 2022 wider margin, and 29-to-10 district winner comparison.');
