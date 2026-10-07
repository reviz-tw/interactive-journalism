import csv,json,runpy,collections
from pathlib import Path
P=Path(__file__).resolve().parent
seat=runpy.run_path(str(P/'analyze.py'))['seat']
groups=collections.defaultdict(list)
for f in (P/'raw').glob('*.csv'):
 typ,term,_=f.stem.split('_',2);year=int(term[:4]);kind={'總統':'總統','縣市長':'市長','區域立委':'立委'}[typ]
 for r in csv.DictReader(f.open(encoding='utf-8-sig')):
  s=seat({'district':r['鄉鎮市區'],'name':r['村里']})
  if s not in (3,6,7,8):continue
  if kind=='立委' and year!=2023:assert r['選區']==f'臺北市第{s:02}選區'
  groups[(s,r['鄉鎮市區'],r['村里'],year,kind)].append(r)
long=[];wide={};stats={}
for (s,d,v,y,k),rs in sorted(groups.items()):
 assert len({r['號次'] for r in rs})==len(rs)
 total=sum(int(r['得票數']) for r in rs);assert total>0
 key=(s,d,v);w=wide.setdefault(key,{'選區':s,'行政區':d,'里':v})
 tag=f'{y}{k}'
 for r in rs:
  share=int(r['得票數'])/total*100
  long.append({'選區':s,'行政區':d,'里':v,'年份':y,'選舉':k,'候選人':r['候選人'],'政黨':r['政黨'],'得票':int(r['得票數']),'有效票':total,'得票率':round(share,4)})
  w[f'{tag}｜{r["候選人"]}']=round(share,4)
 winner=max(rs,key=lambda r:int(r['得票數']))
 blue=next(r for r in rs if r['政黨']=='中國國民黨')
 b=int(blue['得票數'])/total*100
 others=max(int(r['得票數']) for r in rs if r is not blue)/total*100
 stats[(s,d,v,y,k)]={'blue':b,'winner':winner['候選人'],'blue_wins':int(blue['得票數'])>max(int(r['得票數']) for r in rs if r is not blue),'margin':b-others}
 assert abs(sum(int(r['得票數'])/total*100 for r in rs)-100)<1e-8
assert len(wide)==222
for s,n in [(3,62),(6,53),(7,54),(8,53)]:
 for y,k in [(2014,'市長'),(2016,'總統'),(2016,'立委'),(2018,'市長'),(2020,'總統'),(2020,'立委'),(2022,'市長'),(2024,'總統'),(2024,'立委')]:
  assert sum(t[0]==s and t[3:]==(y,k) for t in stats)==n
for file,rows in [('village-candidate-shares.csv',long),('village-comparison.csv',list(wide.values()))]:
 fields=list(dict.fromkeys(f for r in rows for f in r))
 with (P/file).open('w',encoding='utf-8-sig',newline='') as out:
  writer=csv.DictWriter(out,fieldnames=fields);writer.writeheader();writer.writerows(rows)
summary={}
for s in (3,6,7,8):
 keys=[key for key in wide if key[0]==s]
 result={}
 for y,k in [(2014,'市長'),(2016,'總統'),(2016,'立委'),(2018,'市長'),(2020,'總統'),(2020,'立委'),(2022,'市長'),(2024,'總統'),(2024,'立委')]:
  result[f'{y}{k}']=sum(stats[(*key,y,k)]['blue_wins'] for key in keys)
 result['2020總統非藍最高且立委藍最高']=sum(not stats[(*key,2020,'總統')]['blue_wins'] and stats[(*key,2020,'立委')]['blue_wins'] for key in keys)
 result['三屆立委皆藍最高']=sum(all(stats[(*key,y,'立委')]['blue_wins'] for y in (2016,2020,2024)) for key in keys)
 summary[s]=result
 print(s,result)
 examples=[(key,stats[(*key,2020,'立委')]['blue']-stats[(*key,2020,'總統')]['blue']) for key in keys if not stats[(*key,2020,'總統')]['blue_wins'] and stats[(*key,2020,'立委')]['blue_wins']]
 for key,gap in sorted(examples,key=lambda z:-z[1])[:2]:
  print(' EXAMPLE',key, '2020總統',stats[(*key,2020,'總統')], '2020立委',stats[(*key,2020,'立委')], '2022市長',stats[(*key,2022,'市長')], '2024立委',stats[(*key,2024,'立委')])
(P/'village-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print('Validated 222 villages;',len(groups),'village-election totals;',len(long),'candidate records')
