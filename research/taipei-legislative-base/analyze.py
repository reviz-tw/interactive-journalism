"""Aggregate existing village election data to five legislative constituencies.
Exploratory: source village totals and historical boundaries are not fully audited.
"""
import csv,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
data=json.loads((ROOT/'data/taipei-elections.json').read_text())
north={n+'里' for n in '精忠 東光 龍田 東昌 東勢 中華 民有 民福 松基 莊敬 東榮 新益 新東 介壽 三民 富錦 富泰 自強 鵬程 安平'.split()}
south={n+'里' for n in '慈祐 吉祥 新聚 復盛 中正 中崙 美仁 吉仁 敦化 復源 復建 復勢 福成'.split()}
zhongzheng={n+'里' for n in '水源 富水 文盛 林興 河堤 螢圃 網溪 板溪 頂東 螢雪'.split()}
def seat(v):
 d,n=v['district'],v['name']
 if d=='中山區' or (d=='松山區' and n in north): return 3
 if d in ('內湖區','南港區'): return 4
 if d=='大安區': return 6
 if d=='信義區' or (d=='松山區' and n in south): return 7
 if d=='文山區' or (d=='中正區' and n in zhongzheng): return 8
rows=[]
for e in data['elections']:
 if e['year']<2012: continue
 assert {v['name'] for v in e['villages'] if v['district']=='松山區'}==north|south
 assert zhongzheng <= {v['name'] for v in e['villages'] if v['district']=='中正區'}
 for s,expected in [(3,62),(4,59),(6,53),(7,54),(8,53)]:
  villages=[v for v in e['villages'] if seat(v)==s]
  assert len(villages)==expected,(e['id'],s,len(villages))
  valid=sum(v['valid'] for v in villages)
  votes={c['number']:sum(v['votes'].get(c['number'],0) for v in villages) for c in e['candidates']}
  assert sum(votes.values())==valid
  for c in e['candidates']:
   rows.append(dict(election=e['id'],seat=s,candidate=c['name'],party=c['party'],votes=votes[c['number']],valid=valid,share_pct=round(votes[c['number']]/valid*100,6),village_count=len(villages)))
with (Path(__file__).parent/'candidate-shares.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=rows[0].keys());w.writeheader();w.writerows(rows)
print(f'Checked 35 constituency-election totals; exported {len(rows)} candidate records.')
