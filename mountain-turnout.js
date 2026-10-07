const pct=n=>n==null?'資料未提供':n.toFixed(2)+'%';
const fmt=n=>n==null?'—':n.toLocaleString('zh-TW');
export const signed=x=>(x>0?'+':x<0?'−':'')+Math.abs(x).toFixed(1);
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
export const kindName=k=>k==='local'?'縣市長':'總統';
export const color=c=>c.party==='民主進步黨'?'var(--dpp)':c.party==='中國國民黨'?'var(--kmt)':'var(--other)';
export const ordered=a=>[...a.candidates].sort((x,y)=>(x.party==='民主進步黨'?0:x.party==='中國國民黨'?1:2)-(y.party==='民主進步黨'?0:y.party==='中國國民黨'?1:2)||x.number-y.number);
export const winner=a=>a.candidates.reduce((x,y)=>x.votes>y.votes?x:y);
export const roundStats=data=>data.elections.map((e,i)=>{const gaps=data.towns.map(t=>t.results[i].gap);return {...e,mean:mean(gaps),above:gaps.filter(g=>g>0).length};});
export const townStats=t=>({local:mean(t.results.filter(r=>r.kind==='local').map(r=>r.gap)),president:mean(t.results.filter(r=>r.kind==='president').map(r=>r.gap))});
export const sizeGroups=(data,n=6)=>{
 const rows=data.towns.map(t=>({t,size:mean(t.results.filter(r=>r.year>=2014).map(r=>r.electors)),...townStats(t)})).sort((a,b)=>a.size-b.size);
 const g=rs=>({names:rs.map(r=>r.t.name),local:mean(rs.map(r=>r.local)),president:mean(rs.map(r=>r.president))});
 return {small:g(rows.slice(0,n)),large:g(rows.slice(-n))};
};

const NS='http://www.w3.org/2000/svg';
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);parent?.appendChild(e);return e;}
function txt(parent,x,y,s,attrs={}){const e=el('text',{x,y,...attrs},parent);e.textContent=s;return e;}
function svgIn(box,w,h,label){box.replaceChildren();return el('svg',{width:w,height:h,viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':label},box);}
const typeColor=k=>k==='local'?'var(--local)':'var(--pres)';
let tip;
function showTip(ev,html){tip.innerHTML=html;tip.hidden=false;const p=14,r=tip.getBoundingClientRect();let x=ev.clientX+p,y=ev.clientY+p;if(x+r.width>innerWidth-8)x=ev.clientX-r.width-p;if(y+r.height>innerHeight-8)y=ev.clientY-r.height-p;tip.style.left=x+'px';tip.style.top=y+'px';}
const hideTip=()=>{tip.hidden=true;};
const bind=(node,html)=>{node.addEventListener('pointermove',e=>showTip(e,html()));node.addEventListener('pointerleave',hideTip);};
const widthOf=box=>Math.max(300,box.clientWidth-32);

function roundsChart(box,stats){
 const W=widthOf(box),H=320,m={t:26,r:8,b:58,l:40},lo=-10,hi=20,iw=W-m.l-m.r,ih=H-m.t-m.b,n=stats.length;
 const s=svgIn(box,W,H,'各次選舉 30 個山地原住民鄉區與所屬縣市的平均投票率差距'),y=v=>m.t+(hi-v)/(hi-lo)*ih,bw=iw/n,barW=Math.min(46,bw*.62);
 for(let v=lo;v<=hi;v+=5){el('line',{x1:m.l,x2:W-m.r,y1:y(v),y2:y(v),stroke:v===0?'#8d8a80':'var(--grid)','stroke-width':1},s);txt(s,m.l-8,y(v)+4,(v>0?'+':'')+v,{'text-anchor':'end',class:'t-3'});}
 txt(s,m.l,12,'百分點',{class:'t-3','font-size':11});
 stats.forEach((r,i)=>{
  const v=r.mean,cx=m.l+bw*i+bw/2,y0=y(0),y1=y(v),top=Math.min(y0,y1),h=Math.max(1,Math.abs(y1-y0)),rr=Math.min(4,h/2),x0=cx-barW/2,x1=cx+barW/2;
  const d=v>=0?`M${x0},${y0}V${top+rr}Q${x0},${top} ${x0+rr},${top}H${x1-rr}Q${x1},${top} ${x1},${top+rr}V${y0}Z`:`M${x0},${y0}V${y1-rr}Q${x0},${y1} ${x0+rr},${y1}H${x1-rr}Q${x1},${y1} ${x1},${y1-rr}V${y0}Z`;
  el('path',{d,fill:typeColor(r.kind)},s);
  txt(s,cx,v>=0?y1-7:y1+16,signed(v),{'text-anchor':'middle',class:'t-ink','font-size':12.5,'font-weight':700});
  const small=bw<52?10.5:12;txt(s,cx,H-m.b+20,r.id.split(' ')[0],{'text-anchor':'middle','font-size':small});txt(s,cx,H-m.b+36,kindName(r.kind),{'text-anchor':'middle','font-size':small,fill:typeColor(r.kind)});
  bind(el('rect',{x:m.l+bw*i,y:m.t,width:bw,height:ih,fill:'transparent'},s),()=>`<b>${r.id}</b><br>30 鄉區平均差距 <b>${signed(v)}</b> 百分點<small>高於所屬縣市：${r.above} 個鄉區</small>`);
 });
}

function townsChart(box,towns){
 const W=widthOf(box),narrow=W<520,rowH=24,m={t:28,r:14,b:30,l:narrow?70:130},H=m.t+rowH*towns.length+m.b,lo=-25,hi=35,iw=W-m.l-m.r;
 const s=svgIn(box,W,H,'各鄉區在縣市長與總統選舉，相對所屬縣市的平均投票率差距'),x=v=>m.l+(v-lo)/(hi-lo)*iw;
 (narrow?[-20,0,20]:[-20,-10,0,10,20,30]).forEach(v=>{el('line',{x1:x(v),x2:x(v),y1:m.t-6,y2:H-m.b,stroke:v===0?'#8d8a80':'var(--grid)','stroke-width':1},s);txt(s,x(v),m.t-12,(v>0?'+':'')+v,{'text-anchor':'middle',class:'t-3','font-size':11});});
 txt(s,x(lo),H-8,'← 低於所屬縣市',{class:'t-3','font-size':11.5});txt(s,x(hi),H-8,'高於所屬縣市 →',{class:'t-3','font-size':11.5,'text-anchor':'end'});
 towns.forEach((o,j)=>{
  const cy=m.t+rowH*j+rowH/2;if(j%2===0)el('rect',{x:0,y:cy-rowH/2,width:W,height:rowH,fill:'#f3efe6'},s);
  txt(s,m.l-10,cy+4,o.t.name,{'text-anchor':'end',class:'t-ink','font-size':12.5});if(!narrow)txt(s,6,cy+4,o.t.county,{class:'t-3','font-size':11});
  el('line',{x1:x(o.president),x2:x(o.local),y1:cy,y2:cy,stroke:'#b9b3a7','stroke-width':2},s);
  el('circle',{cx:x(o.president),cy,r:5.5,fill:'var(--pres)',stroke:'#fffdf8','stroke-width':2},s);el('circle',{cx:x(o.local),cy,r:5.5,fill:'var(--local)',stroke:'#fffdf8','stroke-width':2},s);
  bind(el('rect',{x:0,y:cy-rowH/2,width:W,height:rowH,fill:'transparent'},s),()=>`<b>${o.t.county} ${o.t.name}</b><br><span style="color:var(--local)">●</span> 縣市長選舉平均 <b>${signed(o.local)}</b><br><span style="color:var(--pres)">●</span> 總統選舉平均 <b>${signed(o.president)}</b><small>百分點，相對所屬縣市</small>`);
 });
}

export const heatColor=v=>{const a=Math.min(1,Math.abs(v)/25),p=Math.round(12+a*88);return v===0?'var(--mid)':`color-mix(in oklab, ${v>0?'#c4402f':'#2f6fa8'} ${p}%, var(--mid))`;};
function heatChart(box,data,towns,showNums){
 const avail=widthOf(box),lw=86,n=data.elections.length,cw=Math.max(50,Math.floor((avail-lw)/n)),rh=24,ht=42,W=lw+cw*n,H=ht+rh*towns.length+2;
 const s=svgIn(box,W,H,'各鄉區各次選舉與所屬縣市的投票率差距');
 data.elections.forEach((e,i)=>{const cx=lw+cw*i+cw/2;txt(s,cx,15,e.id.split(' ')[0],{'text-anchor':'middle','font-size':11.5,class:'t-ink'});txt(s,cx,32,kindName(e.kind),{'text-anchor':'middle','font-size':11,fill:typeColor(e.kind)});});
 towns.forEach((o,j)=>{const y=ht+rh*j;txt(s,lw-8,y+rh/2+4,o.t.name,{'text-anchor':'end','font-size':12.5,class:'t-ink'});
  o.t.results.forEach((r,i)=>{const x=lw+cw*i,c=el('rect',{x:x+1,y:y+1,width:cw-2,height:rh-2,rx:3,fill:heatColor(r.gap)},s);
   if(showNums)txt(s,x+cw/2,y+rh/2+4,signed(r.gap),{'text-anchor':'middle','font-size':11,fill:Math.abs(r.gap)>14?'#fff':'#242720',style:'pointer-events:none'});
   const w=winner(r);bind(c,()=>`<b>${o.t.county} ${o.t.name}</b>・${r.election}<br>鄉區投票率 <b>${pct(r.turnout)}</b><br>${r.countyThen}投票率 ${pct(r.countyTurnout)}<br>差距 <b>${signed(r.gap)}</b> 百分點<small>選舉人 ${fmt(r.electors)}・區內最高票 ${w.name} ${pct(w.share)}</small>`);});});
}

function townChart(box,t){
 const W=widthOf(box),narrow=W<520,H=320,m={t:18,r:narrow?12:84,b:52,l:42},lo=30,hi=100,n=t.results.length,iw=W-m.l-m.r,ih=H-m.t-m.b;
 const s=svgIn(box,W,H,`${t.county}${t.name}與所屬縣市十次選舉投票率`),x=i=>m.l+iw*(i+.5)/n,y=v=>m.t+(hi-v)/(hi-lo)*ih;
 for(let v=lo;v<=hi;v+=10){el('line',{x1:m.l,x2:W-m.r,y1:y(v),y2:y(v),stroke:'var(--grid)','stroke-width':1},s);txt(s,m.l-8,y(v)+4,v+'%',{'text-anchor':'end',class:'t-3','font-size':11});}
 t.results.forEach((r,i)=>{if(r.kind==='local')el('rect',{x:m.l+iw*i/n,y:m.t,width:iw/n,height:ih,fill:'var(--local)',opacity:.07},s);txt(s,x(i),H-m.b+20,r.election.split(' ')[0].replace('2009/2010','09/10'),{'text-anchor':'middle','font-size':11});txt(s,x(i),H-m.b+36,kindName(r.kind),{'text-anchor':'middle','font-size':11,fill:typeColor(r.kind)});});
 const path=(k,stroke,w)=>el('path',{d:t.results.map((r,i)=>`${i?'L':'M'}${x(i)},${y(r[k])}`).join(''),fill:'none',stroke,'stroke-width':w,'stroke-linejoin':'round'},s);
 path('countyTurnout','var(--county)',2);path('turnout','var(--town)',2.5);
 t.results.forEach((r,i)=>{el('circle',{cx:x(i),cy:y(r.countyTurnout),r:4,fill:'var(--county)',stroke:'#fffdf8','stroke-width':2},s);el('circle',{cx:x(i),cy:y(r.turnout),r:5,fill:'var(--town)',stroke:'#fffdf8','stroke-width':2},s);});
 if(!narrow){const L=t.results.at(-1),a=y(L.turnout),b=y(L.countyTurnout),d=Math.abs(a-b)<16?(a<b?[-8,8]:[8,-8]):[0,0];txt(s,x(n-1)+12,a+4+d[0],t.name,{class:'t-ink','font-size':12.5,'font-weight':700});txt(s,x(n-1)+12,b+4+d[1],'所屬縣市',{'font-size':12});}
 const guide=el('line',{y1:m.t,y2:m.t+ih,stroke:'#8d8a80','stroke-width':1,opacity:0},s);
 t.results.forEach((r,i)=>{const hit=el('rect',{x:m.l+iw*i/n,y:m.t,width:iw/n,height:ih,fill:'transparent'},s);
  hit.addEventListener('pointermove',e=>{guide.setAttribute('x1',x(i));guide.setAttribute('x2',x(i));guide.setAttribute('opacity',.7);showTip(e,`<b>${r.election}</b><br>${t.name} <b>${pct(r.turnout)}</b><br>${r.countyThen} ${pct(r.countyTurnout)}<br>差距 <b>${signed(r.gap)}</b> 百分點<small>投票數 ${fmt(r.cast)} ／ 選舉人 ${fmt(r.electors)}</small>`);});
  hit.addEventListener('pointerleave',()=>{guide.setAttribute('opacity',0);hideTip();});});
}

const stack=a=>`<div class="stack" role="img" aria-label="${ordered(a).map(c=>`${c.name} ${pct(c.share)}`).join('；')}">${ordered(a).map(c=>`<i style="width:${c.share}%;background:${color(c)}" title="${c.name} ${pct(c.share)}"></i>`).join('')}</div>`;
function townHistory(box,t){
 box.replaceChildren();
 for(const r of [...t.results].reverse()){const w=winner(r),row=document.createElement('div');row.className='town-row';
  row.innerHTML=`<div class="when"><b class="y">${r.year}</b><small class="${r.kind==='local'?'kind-local':'kind-pres'}">${r.election.split(' ')[1]}</small><small>${r.townThen}</small></div><div class="ballot"><div class="meta"><span>最高票 ${w.name}（${w.party}）${pct(w.share)}</span><span>${ordered(r).length} 位候選人</span></div>${stack(r)}</div><div class="gapbox"><span class="gap">${signed(r.gap)} <small>百分點</small></span><small>投票率 ${pct(r.turnout)}・${r.countyThen} ${pct(r.countyTurnout)}</small></div>`;
  box.append(row);}
}

async function init(){
 const $=id=>document.getElementById(id),res=await fetch('data/mountain-turnout.json');if(!res.ok)throw new Error('Data failed');const data=await res.json();
 tip=$('tip');const stats=roundStats(data),towns=data.towns.map(t=>({t,...townStats(t)})).sort((a,b)=>b.local-a.local);
 let showNums=false;
 const draw=()=>{roundsChart($('chart-rounds'),stats);townsChart($('chart-towns'),towns);heatChart($('chart-heat'),data,towns,showNums);townChart($('town-chart'),data.towns[+$('town-select').value]);};
 data.towns.forEach((t,i)=>$('town-select').append(new Option(`${t.county} ${t.name}`,i)));
 $('town-select').value=String(data.towns.findIndex(t=>t.stem==='茂林'));
 const town=()=>{const t=data.towns[+$('town-select').value];$('town-title').textContent=`${t.name}｜十次選舉的投票率與得票`;townChart($('town-chart'),t);townHistory($('town-history'),t);};
 $('town-select').onchange=town;
 $('heat-numbers').onclick=()=>{showNums=!showNums;$('heat-numbers').setAttribute('aria-pressed',String(showNums));$('heat-numbers').textContent=showNums?'隱藏數值':'顯示數值';heatChart($('chart-heat'),data,towns,showNums);};
 $('heat-scale').innerHTML=[-20,-10,-3,3,10,20].map(v=>`<i style="background:${heatColor(v)}"></i>`).join('');
 draw();town();
 let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(draw,150);});
 $('load-status').textContent='';
 if(location.hash)requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView({behavior:'instant',block:'start'}));
}
if(typeof document!=='undefined')init().catch(error=>{document.getElementById('load-status').textContent='資料載入失敗，請重新整理。';console.error(error)});
