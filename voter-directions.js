const explorer=document.querySelector('.direction-explorer');
if(explorer){
 const select=document.getElementById('direction-district');
 let rows;
 try{const data=await fetch('data/dual-city-voter-directions.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();});rows=data.cities[explorer.dataset.city];}
 catch{document.getElementById('direction-label').textContent+='｜其他行政區暫時無法載入，請重新整理。';select.disabled=true;}
 if(rows)select.addEventListener('change',()=>{
  const row=rows.find(r=>r.district===select.value);if(!row)return;
  const body=document.querySelector('#direction-series tbody');body.replaceChildren();
  for(const s of row.series){
   const tr=document.createElement('tr');
   const cells=[`${s.year} ${s.type==='總統'?'總統':'市長'}`,`${s.turnout.toFixed(2)}%`,s.winner,s.candidates.filter(c=>c.share>=1).sort((a,b)=>b.votes-a.votes).map(c=>`${c.name} ${c.share.toFixed(2)}%`).join('；')];
   for(const text of cells){const td=document.createElement('td');td.textContent=text;tr.append(td);}
   const note=document.createElement('small');note.textContent='（未滿 1% 者省略，完整票數見歷屆選票）';tr.lastChild.append(note);body.append(tr);
  }
  document.getElementById('direction-label').textContent=`${row.district}｜2014–2024，依年份排列`;
 });
}
