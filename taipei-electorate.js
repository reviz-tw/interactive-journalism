const $=id=>document.getElementById(id),fmt=n=>Math.round(n).toLocaleString('zh-TW'),pct=n=>n.toFixed(2)+'%',DPP='民主進步黨',KMT='中國國民黨';
const displayName=n=>n.replace(/[\uE000-\uF8FF]/g,'〔原表缺字〕');
const color=c=>c.party===DPP?'#367b64':c.party===KMT?'#466ea5':'#81778e';
const sum=(vs,key)=>vs.reduce((a,v)=>a+v[key],0),votes=(vs,c)=>vs.reduce((a,v)=>a+(v.votes[c.number]||0),0);
function aggregate(e,vs=e.villages){return {valid:sum(vs,'valid'),cast:sum(vs,'cast'),electors:sum(vs,'electors'),invalid:sum(vs,'invalid'),candidates:e.candidates.map(c=>({...c,votes:votes(vs,c)}))};}
function partyVotes(a,p){return a.candidates.filter(c=>c.party===p).reduce((n,c)=>n+c.votes,0)}
const margin=a=>100*(partyVotes(a,DPP)-partyVotes(a,KMT))/a.valid;
function table(a){return `<div class="table-wrap"><table><thead><tr><th>候選人／政黨</th><th>得票數</th><th>得票率</th></tr></thead><tbody>${a.candidates.slice().sort((a,b)=>b.votes-a.votes).map(c=>`<tr><td class="candidate-name">${c.name}<small>${c.party}</small></td><td>${fmt(c.votes)}</td><td>${pct(100*c.votes/a.valid)}</td></tr>`).join('')}</tbody></table></div>`}
function stack(a){const partyOrder=c=>c.party===DPP?0:c.party===KMT?1:2;return `<div class="stack">${a.candidates.slice().sort((a,b)=>partyOrder(a)-partyOrder(b)).map(c=>`<i style="width:${100*c.votes/a.valid}%;background:${color(c)}" title="${c.name} ${pct(100*c.votes/a.valid)}"></i>`).join('')}</div>`}
export function regionSeries(elections,district,village='',type='all'){
  return elections.filter(e=>type==='all'||e.type===type).slice().sort((a,b)=>a.year-b.year).map(e=>{
    const vs=e.villages.filter(v=>v.district===district&&(!village||v.name===village));
    if(!vs.length)return {e,missing:true};
    const a=aggregate(e,vs),rank=a.candidates.slice().sort((a,b)=>b.votes-a.votes),hasDpp=e.candidates.some(c=>c.party===DPP),hasKmt=e.candidates.some(c=>c.party===KMT);
    return {e,a,villageCount:vs.length,turnout:100*a.cast/a.electors,winner:rank[0],dpp:hasDpp?100*partyVotes(a,DPP)/a.valid:null,kmt:hasKmt?100*partyVotes(a,KMT)/a.valid:null};
  });
}

function toggleExclusiveRow(container,button,detail,toggleSelector,closedLabel,openLabel){
  const open=detail.hidden;
  container.querySelectorAll('button[aria-controls]').forEach(row=>{
    const panel=document.getElementById(row.getAttribute('aria-controls'));
    if(panel)panel.hidden=true;
    row.setAttribute('aria-expanded','false');row.classList.remove('active');
    const label=row.querySelector(toggleSelector);if(label)label.textContent=closedLabel;
  });
  detail.hidden=!open;button.setAttribute('aria-expanded',String(open));button.classList.toggle('active',open);
  button.querySelector(toggleSelector).textContent=open?openLabel:closedLabel;
}

async function init(){let [data,geo]=await Promise.all([fetch('data/taipei-elections.json').then(r=>{if(!r.ok)throw Error('選舉資料讀取失敗');return r.json()}),fetch('data/taipei-villages.geojson').then(r=>{if(!r.ok)throw Error('地圖資料讀取失敗');return r.json()})]);const elections=data.elections,find=id=>elections.find(e=>e.id===id),districts=[...new Set(elections.at(-1).villages.map(v=>v.district))];
for(let id of ['geo-election','compare-election']){ $(id).innerHTML=elections.map(e=>`<option value="${e.id}">${e.id}</option>`).join('');$(id).value='2024 總統';}

for(let e of elections.slice().sort((a,b)=>a.year-b.year)){let a=aggregate(e),item=document.createElement('div'),b=document.createElement('button'),detail=document.createElement('div');item.className='history-item';b.className='history-row';b.dataset.id=e.id;detail.id='history-detail-'+e.year;detail.className='panel history-detail';detail.hidden=true;detail.innerHTML=`<h3>${e.id}｜全市結果</h3><p>投票率 ${pct(100*a.cast/a.electors)} · 有效票 ${fmt(a.valid)} · 選舉人 ${fmt(a.electors)}</p>${table(a)}`;b.innerHTML=`<div class="history-year"><strong>${e.year}</strong><span>${e.type==='總統'?'總統選舉':'台北市長'}</span></div><div class="history-ballot"><div class="row-meta"><span>投票率 ${pct(100*a.cast/a.electors)}</span><span class="history-toggle">展開票數 ＋</span></div>${stack(a)}</div>`;b.setAttribute('aria-label',`${e.id}候選人票數`);b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls',detail.id);b.onclick=()=>toggleExclusiveRow($('history-timeline'),b,detail,'.history-toggle','展開票數 ＋','收起票數 −');item.append(b,detail);$('history-timeline').append(item)}
const coords=[];function collect(a){if(typeof a[0]==='number')coords.push(a);else a.forEach(collect)}geo.features.forEach(f=>collect(f.geometry.coordinates));const minX=Math.min(...coords.map(p=>p[0])),maxX=Math.max(...coords.map(p=>p[0])),minY=Math.min(...coords.map(p=>p[1])),maxY=Math.max(...coords.map(p=>p[1]));const sx=520/((maxX-minX)*Math.cos(25*Math.PI/180)),sy=520/(maxY-minY),s=Math.min(sx,sy),project=p=>[40+(p[0]-minX)*Math.cos(25*Math.PI/180)*s,550-(p[1]-minY)*s];function path(f){let polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;return polys.map(poly=>poly.map(r=>r.map((p,i)=>`${i?'L':'M'}${project(p).map(v=>v.toFixed(1)).join(',')}`).join('')+'Z').join('')).join('')}
function showPlace(e,vs,title){let a=aggregate(e,vs);$('map-detail').innerHTML=`<p class="eyebrow">${e.id}</p><h3>${title}</h3><p>投票率 ${pct(100*a.cast/a.electors)}<br>有效票 ${fmt(a.valid)} · 選舉人 ${fmt(a.electors)}</p>${table(a)}<p class="caption">${e.candidates.some(c=>c.party===DPP)?'民進黨 − 國民黨：'+margin(a).toFixed(2)+' 個百分點':'本屆無民進黨候選人，藍綠候選人差距不適用。'}</p>`;}
function map(){let e=find($('geo-election').value),level=$('geo-level').value,metric=$('geo-metric').value;const comparable=e.candidates.some(c=>c.party===DPP)&&e.candidates.some(c=>c.party===KMT);$('geo-metric').options[0].disabled=!comparable;if(!comparable&&metric==='margin'){$('geo-metric').value='winner';metric='winner'}if(e.year<2010){$('geo-level').value='district';level='district'}$('geo-level').options[1].disabled=e.year<2010;let vmap=new Map(e.villages.map(v=>[v.district+'|'+v.name,v])),dmap=new Map(districts.map(d=>[d,aggregate(e,e.villages.filter(v=>v.district===d))]));let matched=0;const ns='http://www.w3.org/2000/svg';$('map').replaceChildren();for(let f of geo.features){let {district,name}=f.properties,v=vmap.get(district+'|'+name),a=level==='district'?dmap.get(district):v&&aggregate(e,[v]);if(v)matched++;let p=document.createElementNS(ns,'path');p.setAttribute('d',path(f));let fill='#ddd9d1';if(a){if(metric==='winner')fill=color(a.candidates.reduce((a,b)=>a.votes>=b.votes?a:b));else if(metric==='turnout')fill=`hsl(23 82% ${95-(100*a.cast/a.electors-40)*.9}%)`;else{let m=margin(a);fill=Math.abs(m)<1?'#e6e0d3':`hsl(${m>0?157:216} ${m>0?30:43}% ${88-Math.min(Math.abs(m),35)}%)`;}}p.setAttribute('fill',fill);let label=level==='district'?district:district+displayName(name);p.setAttribute('aria-label',label+(a?`，投票率 ${pct(100*a.cast/a.electors)}，差距 ${margin(a).toFixed(2)} 個百分點`:'，無對應資料'));let t=document.createElementNS(ns,'title');t.textContent=p.getAttribute('aria-label');p.append(t);p.setAttribute('tabindex',level==='village'?'0':'-1');if(a){const show=()=>showPlace(e,level==='district'?e.villages.filter(v=>v.district===district):[v],label);p.onclick=show;p.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();show()}}}$('map').append(p)}if(level==='district'){for(let d of districts){let fs=geo.features.filter(f=>f.properties.district===d),points=[];for(let f of fs){let ring=f.geometry.type==='Polygon'?f.geometry.coordinates[0]:f.geometry.coordinates[0][0];points.push(...ring)}let x=points.reduce((a,p)=>a+p[0],0)/points.length,y=points.reduce((a,p)=>a+p[1],0)/points.length,t=document.createElementNS(ns,'text'),[px,py]=project([x,y]);t.setAttribute('x',px);t.setAttribute('y',py);t.setAttribute('text-anchor','middle');t.textContent=d;$('map').append(t)}}$('map-legend').innerHTML=metric==='margin'?'<span class="dpp">● 民進黨較高</span><span class="kmt">● 國民黨較高</span><span>● 差距小於 1 百分點</span>':metric==='winner'?'<span class="dpp">● 民進黨</span><span class="kmt">● 國民黨</span><span class="other">● 其他候選人</span>':'<span>淡橘 → 深橘：投票率較低 → 較高</span>';$('map-note').textContent=level==='village'?`里名對應 ${matched}／${e.villages.length}。未對應：${e.villages.filter(v=>!geo.features.some(f=>f.properties.district===v.district&&f.properties.name===v.name)).map(v=>v.district+displayName(v.name)).join('、')}；仍可從右方清單查看。參考里界不是當年精確邊界。`:'點選地圖，或從右方清單選擇。';showPlace(e,e.villages,'台北市');search();}
function search(){let e=find($('geo-election').value),query=$('village-search').value.trim(),level=$('geo-level').value;let items=level==='district'?districts.filter(d=>d.includes(query)).map(d=>({title:d,vs:e.villages.filter(v=>v.district===d)})):e.villages.filter(v=>(v.district+v.name).includes(query)).map(v=>({title:v.district+' '+displayName(v.name),vs:[v]}));$('village-results').replaceChildren();for(let item of items){let b=document.createElement('button'),a=aggregate(e,item.vs);b.textContent=e.candidates.some(c=>c.party===DPP)?`${item.title}　${margin(a)>0?'+':''}${margin(a).toFixed(2)} pp`:item.title;b.onclick=()=>showPlace(e,item.vs,item.title);$('village-results').append(b)}if(!items.length)$('village-results').textContent='沒有符合的區或里。';}
['geo-election','geo-level','geo-metric'].forEach(id=>$(id).onchange=map);$('village-search').oninput=search;map();
$('compare-district').innerHTML+=districts.map(d=>`<option>${d}</option>`).join('');
let comparePage=0;
function compareRegions(){
  const e=find($('compare-election').value),village=$('compare-level').value==='village',district=$('compare-district').value,mode=$('compare-sort').value;
  $('compare-district-label').hidden=!village;
  const groups=new Map();for(const v of e.villages){if(village&&district&&v.district!==district)continue;const key=village?v.district+'|'+v.name:v.district;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(v);}
  const hasDpp=e.candidates.some(c=>c.party===DPP);$('compare-sort').options[1].disabled=!hasDpp;
  if(!hasDpp&&mode==='dpp'){$('compare-sort').value='turnout';return compareRegions();}
  const rows=[...groups.values()].map(vs=>{let a=aggregate(e,vs),rank=a.candidates.slice().sort((a,b)=>b.votes-a.votes);return {a,name:village?displayName(vs[0].name):vs[0].district,district:vs[0].district,turnout:100*a.cast/a.electors,winner:rank[0],dpp:hasDpp?100*partyVotes(a,DPP)/a.valid:null,kmt:100*partyVotes(a,KMT)/a.valid};}).sort((a,b)=>b[$('compare-sort').value]-a[$('compare-sort').value]);
  const pages=Math.max(1,Math.ceil(rows.length/12));comparePage=Math.min(comparePage,pages-1);const shown=rows.slice(comparePage*12,comparePage*12+12),label=$('compare-sort').selectedOptions[0].text;
  $('compare-summary').textContent=`${e.id}｜${village?(district||'全市')+'各里':'12 個行政區'}，${label}。${rows.length?`投票率範圍 ${pct(Math.min(...rows.map(r=>r.turnout)))}–${pct(Math.max(...rows.map(r=>r.turnout)))}。`:''}${hasDpp?'':'本屆民進黨未提名候選人，仍保留當地所有候選人的結果。'}`;
  $('compare-rows').replaceChildren();for(const [i,r]of shown.entries()){
    const item=document.createElement('div'),b=document.createElement('button'),detail=document.createElement('div');b.className='region-year-row comparison-row';detail.id='compare-detail-'+i;detail.className='panel region-year-detail';detail.hidden=true;
    b.innerHTML=`<div class="region-place"><strong>${r.name}</strong>${village?`<small>${r.district}</small>`:''}</div><div class="region-turnout"><b>投票率 ${pct(r.turnout)}</b><div class="turnout-track"><i style="width:${r.turnout}%"></i></div></div><div class="region-ballot"><div class="row-meta"><span>當地最高票：${r.winner.name} ${pct(100*r.winner.votes/r.a.valid)}</span><span class="region-toggle">票數 ＋</span></div>${stack(r.a)}<div class="region-shares"><span class="dpp">民進黨 ${r.dpp===null?'未提名':pct(r.dpp)}</span><span class="kmt">國民黨 ${pct(r.kmt)}</span><span class="other">其他合計 ${pct(Math.max(0,100-(r.dpp||0)-r.kmt))}</span></div></div>`;
    detail.innerHTML=`<h3>${r.district}${village?' '+r.name:''}｜${e.id}</h3><p>選舉人 ${fmt(r.a.electors)} · 投票數 ${fmt(r.a.cast)} · 有效票 ${fmt(r.a.valid)} · 無效票 ${fmt(r.a.invalid)}</p>${table(r.a)}`;
    b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls',detail.id);b.setAttribute('aria-label',`${r.district} ${village?r.name:''}，投票率 ${pct(r.turnout)}，當地最高票 ${r.winner.name}，展開票數`);b.onclick=()=>toggleExclusiveRow($('compare-rows'),b,detail,'.region-toggle','票數 ＋','收起 −');item.append(b,detail);$('compare-rows').append(item);
  }
  $('compare-page').textContent=`${comparePage+1}／${pages} 頁 · 共 ${rows.length} 個${village?'里':'行政區'}`;$('compare-prev').disabled=comparePage===0;$('compare-next').disabled=comparePage===pages-1;
}
['compare-election','compare-level','compare-district','compare-sort'].forEach(id=>$(id).onchange=()=>{comparePage=0;compareRegions()});$('compare-prev').onclick=()=>{comparePage--;compareRegions()};$('compare-next').onclick=()=>{comparePage++;compareRegions()};compareRegions();

$('region-district').innerHTML=districts.map(d=>`<option>${d}</option>`).join('');
function regionVillages(){
  const district=$('region-district').value,raw=[...new Set(elections.flatMap(e=>e.villages.filter(v=>v.district===district).map(v=>v.name)))].sort((a,b)=>a.localeCompare(b,'zh-TW'));
  $('region-village').replaceChildren(new Option('全區（行政區合計）',''));
  for(const name of raw){const years=elections.filter(e=>e.villages.some(v=>v.district===district&&v.name===name)).map(e=>e.year);let label=displayName(name);if(/[\uE000-\uF8FF]/.test(name))label+=`（${years.join('、')} 原表）`;$('region-village').append(new Option(label,name));}
  renderRegion();
}
function renderRegion(){
  const district=$('region-district').value,village=$('region-village').value,type=$('region-type').value,series=regionSeries(elections,district,village,type),available=series.filter(r=>!r.missing),title=district+(village?' '+displayName(village):'全區');
  $('region-history').replaceChildren();
  if(available.length){const lo=available.reduce((a,b)=>a.turnout<=b.turnout?a:b),hi=available.reduce((a,b)=>a.turnout>=b.turnout?a:b);$('region-summary').textContent=`${title}｜${available.length} 次有資料的選舉。投票率最低：${lo.e.year} 年${lo.e.type==='總統'?'總統':'市長'} ${pct(lo.turnout)}；最高：${hi.e.year} 年${hi.e.type==='總統'?'總統':'市長'} ${pct(hi.turnout)}。下方逐年對照當地最高票者與得票比例。`;}else $('region-summary').textContent=`${title}在所選選舉種類沒有資料。`;
  for(const r of series){if(r.missing){let missing=document.createElement('div');missing.className='region-missing';missing.textContent=`${r.e.year}｜${r.e.type==='總統'?'總統':'市長'}：原表沒有這個「行政區＋里名」的資料，不補零、不連接其他里。`;$('region-history').append(missing);continue;}
    const item=document.createElement('div'),b=document.createElement('button'),detail=document.createElement('div'),id='region-detail-'+r.e.year;
    item.className='region-year-item';b.className='region-year-row';b.dataset.year=r.e.year;detail.id=id;detail.className='panel region-year-detail';detail.hidden=true;
    detail.innerHTML=`<h3>${title}｜${r.e.id}</h3><p>選舉人 ${fmt(r.a.electors)} · 投票數 ${fmt(r.a.cast)} · 有效票 ${fmt(r.a.valid)} · 無效票 ${fmt(r.a.invalid)}</p>${table(r.a)}`;
    b.innerHTML=`<div class="region-date"><strong>${r.e.year}</strong><small>${r.e.type==='總統'?'總統選舉':'市長選舉'}</small></div><div class="region-turnout"><b>投票率 ${pct(r.turnout)}</b><div class="turnout-track"><i style="width:${r.turnout}%"></i></div></div><div class="region-ballot"><div class="row-meta"><span>當地最高票：${r.winner.name} ${pct(100*r.winner.votes/r.a.valid)}</span><span class="region-toggle">票數 ＋</span></div>${stack(r.a)}<div class="region-shares"><span class="dpp">民進黨 ${r.dpp===null?'未提名':pct(r.dpp)}</span><span class="kmt">國民黨 ${r.kmt===null?'未提名':pct(r.kmt)}</span><span class="other">其他候選人合計 ${pct(Math.max(0,100-(r.dpp||0)-(r.kmt||0)))}</span></div></div>`;
    b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls',id);b.setAttribute('aria-label',`${title} ${r.e.id}，投票率 ${pct(r.turnout)}，當地最高票 ${r.winner.name}，展開候選人票數`);
    b.onclick=()=>toggleExclusiveRow($('region-history'),b,detail,'.region-toggle','票數 ＋','收起 −');
    item.append(b,detail);$('region-history').append(item);
  }
  const missing=series.filter(r=>r.missing).map(r=>r.e.year);$('region-coverage').textContent=village?`里別僅依原表「行政區＋里名」精確對應，不代表歷年里界與人口相同。${missing.length?'缺漏年份：'+missing.join('、')+'。':'所選年份皆有同名資料，仍未核驗歷史邊界。'}不合併富臺／富台、糖廍／原表缺字等異名。`:'行政區由當年各里加總；歷年里數或人口可能改變。其他候選人合計僅為閱讀方便，不代表同一陣營；色塊仍按候選人各自列示。';
}
$('region-district').onchange=regionVillages;['region-village','region-type'].forEach(id=>$(id).onchange=renderRegion);regionVillages();
function turnoutView(region){$('region-view').hidden=!region;$('compare-view').hidden=region;$('view-region').setAttribute('aria-pressed',String(region));$('view-compare').setAttribute('aria-pressed',String(!region));}
$('view-region').onclick=()=>turnoutView(true);$('view-compare').onclick=()=>turnoutView(false);

$('load-status').textContent='';
}
if(typeof document!=='undefined')init().catch(e=>{$('load-status').textContent='資料載入失敗，請重新整理後再試。';console.error(e)});
