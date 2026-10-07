const pct=n=>n==null?'資料未提供':n.toFixed(2)+'%';
const fmt=n=>n==null?'—':n.toLocaleString('zh-TW');
export const color=c=>c.party==='民主進步黨'?'var(--dpp)':c.party==='中國國民黨'?'var(--kmt)':'var(--other)';
export const ordered=a=>[...a.candidates].sort((a,b)=>(a.party==='民主進步黨'?0:a.party==='中國國民黨'?1:2)-(b.party==='民主進步黨'?0:b.party==='中國國民黨'?1:2)||Number(a.number)-Number(b.number));
export const districtSeries=(elections,district,type='all')=>elections.filter(e=>e.districts?.[district]&&(type==='all'||(type==='president'?e.type==='總統':e.type!=='總統'))).map(e=>({e,a:e.districts[district]}));
export const leaders=(elections)=>{
 const selected=elections.filter(e=>['2018 臺南市長','2020 總統','2022 臺南市長','2024 總統'].includes(e.id));
 return Object.keys(selected[0].districts).map(name=>({name,results:selected.map(e=>({e,a:e.districts[name],winner:e.districts[name].candidates.reduce((a,b)=>a.votes>b.votes?a:b)}))}));
};
const stack=a=>`<div class="stack" role="img" aria-label="${ordered(a).map(c=>`${c.name} ${pct(c.share)}`).join('；')}">${ordered(a).map(c=>`<i style="width:${c.share}%;background:${color(c)}" title="${c.name} ${pct(c.share)}"></i>`).join('')}</div>`;
const table=a=>`<div class="table-wrap"><table><thead><tr><th>候選人／政黨</th><th>得票數</th><th>有效票占比</th><th>全體選舉人占比</th></tr></thead><tbody>${ordered(a).map(c=>`<tr><td>${c.name}<small>${c.party}</small></td><td>${fmt(c.votes)}</td><td>${pct(c.share)}</td><td>${pct(a.electors?100*c.votes/a.electors:null)}</td></tr>`).join('')}</tbody></table></div><p class="caption">選舉人 ${fmt(a.electors)} · 投票數 ${fmt(a.cast)} · 有效票 ${fmt(a.valid)} · 無效票 ${fmt(a.invalid)}</p>`;
function addRows(container,series,prefix){
 container.replaceChildren();
 for(const {e,a} of series){
  const winner=a.candidates.reduce((a,b)=>a.votes>b.votes?a:b),item=document.createElement('div'),button=document.createElement('button'),detail=document.createElement('div');
  button.className='ballot-row';button.setAttribute('aria-expanded','false');detail.id=`${prefix}-${e.date}`;button.setAttribute('aria-controls',detail.id);detail.hidden=true;detail.className='panel ballot-detail';
  button.innerHTML=`<div class="ballot-date"><b>${e.year}</b><small>${e.type}<br>${e.date}</small></div><div class="ballot-result"><div class="row-meta"><span>最高票 ${winner.name} ${pct(winner.share)}</span><span class="toggle-label">展開票數 ＋</span></div>${stack(a)}</div><div class="ballot-turnout"><b>投票率 ${pct(a.turnout)}</b><div class="turnout-track"><i style="width:${a.turnout||0}%"></i></div></div>`;
  detail.innerHTML=`<h3>${e.id}</h3>${table(a)}`;
  button.onclick=()=>{
   const opening=detail.hidden;
   container.querySelectorAll('.ballot-detail').forEach(el=>el.hidden=true);
   container.querySelectorAll('.ballot-row').forEach(el=>{el.setAttribute('aria-expanded','false');el.querySelector('.toggle-label').textContent='展開票數 ＋'});
   detail.hidden=!opening;button.setAttribute('aria-expanded',String(opening));button.querySelector('.toggle-label').textContent=opening?'收起票數 −':'展開票數 ＋';
  };
  item.append(button,detail);container.append(item);
 }
}
async function init(){
 const $=id=>document.getElementById(id),response=await fetch('data/tainan-elections.json');if(!response.ok)throw new Error('Election data failed');const data=await response.json();
 addRows($('history-timeline'),data.elections.map(e=>({e,a:e.total})),'history');
 const districts=Object.keys(data.elections.find(e=>e.year===2022).districts);
 for(const district of districts)$('region-district').append(new Option(district,district));
 $('region-district').value='永康區';
 function region(){const name=$('region-district').value,series=districtSeries(data.elections,name,$('region-type').value);$('region-title').textContent=name+'｜市長票與總統票放在一起看';addRows($('region-history'),series,'region');$('region-coverage').textContent=`${name}顯示 ${series.length} 次選舉。涵蓋合併後 2010–2024 年；行政區合計不代表歷年是同一群選民。`;}
 $('region-district').onchange=region;$('region-type').onchange=region;region();
 const rows=leaders(data.elections);
 function matrix(){const mode=$('district-filter').value,display=rows.filter(r=>mode==='all'||new Set(r.results.map(v=>v.winner.party)).size>1);$('matrix-count').textContent=`${display.length} 區｜依區名排列；不同職位的領先變化，不代表個人轉投。`;$('district-matrix').replaceChildren();for(const r of display){const button=document.createElement('button');button.className='district-card';button.innerHTML=`<h3>${r.name} <span>查看歷年 ↗</span></h3>${r.results.map(v=>`<div><small>${v.e.year} ${v.e.type}</small><b style="color:${color(v.winner)}">${v.winner.name} ${pct(v.winner.share)}</b><small>投票率 ${pct(v.a.turnout)}</small></div>`).join('')}`;button.onclick=()=>{$('region-district').value=r.name;$('region-type').value='all';region();$('region-explorer').scrollIntoView({behavior:'smooth',block:'start'});$('region-district').focus({preventScroll:true});};$('district-matrix').append(button);}}
 $('district-filter').onchange=matrix;matrix();$('load-status').textContent='';
 if(location.hash)requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView({behavior:'instant',block:'start'}));
}
if(typeof document!=='undefined')init().catch(error=>{document.getElementById('load-status').textContent='資料載入失敗，請重新整理。';console.error(error)});
