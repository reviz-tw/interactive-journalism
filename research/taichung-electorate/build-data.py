import csv,json,collections
from pathlib import Path
rows=list(csv.DictReader(open('research/taichung-electorate/source.csv')))
selected=[r for r in rows if int(r['年'])>=2010]
def aggregate(rs):
 units={}; candidates={}
 for r in rs:
  key=(r['原縣市'],r['行政區'],r['村里'])
  stats=tuple(int(r[k]) for k in ['有效票','無效票','投票數','選舉人數'])
  assert key not in units or units[key]==stats
  units[key]=stats
  c=candidates.setdefault(r['候選人'],dict(number=r['號次'],name=r['候選人'],party=r['政黨'],votes=0))
  c['votes']+=int(r['得票數'])
 valid,invalid,cast,electors=[sum(u[i] for u in units.values()) for i in range(4)]
 assert sum(c['votes'] for c in candidates.values())==valid
 assert valid+invalid==cast and cast<=electors
 for c in candidates.values():c['share']=100*c['votes']/valid
 return dict(valid=valid,invalid=invalid,cast=cast,electors=electors,candidateTotal=valid,turnout=100*cast/electors,candidates=list(candidates.values()))
seen=set()
for r in rows:
 key=tuple(r[k] for k in ['選舉','原縣市','行政區','村里','號次']);assert key not in seen,key;seen.add(key)
es=[]
for id in sorted(set(r['選舉'] for r in selected)):
 rs=[r for r in selected if r['選舉']==id]
 es.append(dict(id=id,date=rs[0]['選舉日'][:10],year=int(rs[0]['年']),type=rs[0]['類型'],levels=['里'],total=aggregate(rs),districts={d:aggregate([r for r in rs if r['行政區']==d]) for d in sorted(set(r['行政區'] for r in rs))}))
es.sort(key=lambda e:e['date'])
out=dict(source='https://docs.google.com/spreadsheets/d/1Qt0YigHf0s8Qd27pD9TGmH5AenInFW9e01Kuu5pRFWg/edit',rows=len(rows),headers=list(rows[0]),elections=es)
Path('data/taichung-elections.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')))
for e in es:
 print(e['id'],round(e['total']['turnout'],2),[(c['name'],c['votes'],round(c['share'],2)) for c in e['total']['candidates']])
 wins=collections.Counter(max(a['candidates'],key=lambda c:c['votes'])['name'] for a in e['districts'].values());print('wins',dict(wins))
e24=es[-1]
print('Ko top', sorted([(d,next(c['share'] for c in a['candidates'] if c['name']=='柯文哲')) for d,a in e24['districts'].items()],key=lambda x:-x[1])[:8])
for d in ['北屯區','大里區','太平區','西屯區','沙鹿區','烏日區','大甲區','和平區']:
 print(d,[(e['year'],round(e['districts'][d]['turnout'],2),[(c['name'],round(c['share'],2)) for c in e['districts'][d]['candidates']]) for e in es if e['year']>=2018])
print('Ko above Hou',[d for d,a in e24['districts'].items() if next(c['votes'] for c in a['candidates'] if c['name']=='柯文哲')>next(c['votes'] for c in a['candidates'] if c['name']=='侯友宜')])
