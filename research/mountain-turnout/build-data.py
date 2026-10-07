"""Build data/mountain-turnout.json from research/mountain-turnout/source.csv and county.csv.
Run from the repository root: python3 research/mountain-turnout/build-data.py"""
import csv, json
from pathlib import Path

HERE = Path('research/mountain-turnout')
rows = list(csv.DictReader(open(HERE / 'source.csv', encoding='utf-8')))
county = {(int(r['年']), r['類別'], r['縣市']): (int(r['投票數']), int(r['選舉人數']))
          for r in csv.DictReader(open(HERE / 'county.csv', encoding='utf-8'))}

ORDER = ['2005 縣市長', '2008 總統', '2009/2010 縣市長', '2012 總統', '2014 縣市長',
         '2016 總統', '2018 縣市長', '2020 總統', '2022 縣市長', '2024 總統']
TOWNS = [('新北市', '烏來'), ('桃園市', '復興'), ('新竹縣', '尖石'), ('新竹縣', '五峰'), ('苗栗縣', '泰安'),
         ('臺中市', '和平'), ('南投縣', '信義'), ('南投縣', '仁愛'), ('嘉義縣', '阿里山'), ('高雄市', '茂林'),
         ('高雄市', '桃源'), ('高雄市', '那瑪夏'), ('屏東縣', '三地門'), ('屏東縣', '霧臺'), ('屏東縣', '瑪家'),
         ('屏東縣', '泰武'), ('屏東縣', '來義'), ('屏東縣', '春日'), ('屏東縣', '獅子'), ('屏東縣', '牡丹'),
         ('宜蘭縣', '大同'), ('宜蘭縣', '南澳'), ('花蓮縣', '秀林'), ('花蓮縣', '萬榮'), ('花蓮縣', '卓溪'),
         ('臺東縣', '海端'), ('臺東縣', '延平'), ('臺東縣', '達仁'), ('臺東縣', '金峰'), ('臺東縣', '蘭嶼')]
DISTRICT_CITIES = {'新北市', '桃園市', '臺中市', '高雄市'}

seen = set()
for r in rows:
    k = (r['輪次'], r['縣市'], r['鄉區'], r['號次'])
    assert k not in seen, k
    seen.add(k)

towns = []
for c, t in TOWNS:
    results = []
    for rnd in ORDER:
        rs = [r for r in rows if r['縣市'] == c and r['鄉區'] == t and r['輪次'] == rnd]
        assert rs, (c, t, rnd)
        r0 = rs[0]
        stats = {k: int(r0[k]) for k in ['有效票', '無效票', '投票數', '選舉人數']}
        for r in rs:
            assert {k: int(r[k]) for k in stats} == stats, (c, t, rnd)
        valid, invalid, cast, electors = stats['有效票'], stats['無效票'], stats['投票數'], stats['選舉人數']
        cands = [dict(number=int(r['號次']), name=r['候選人'], running=r['副手'], party=r['政黨'],
                      elected=r['全縣市當選'] == 'Y', votes=int(r['得票數'])) for r in rs]
        assert sum(x['votes'] for x in cands) == valid and valid + invalid == cast and cast <= electors, (c, t, rnd)
        for x in cands:
            x['share'] = round(100 * x['votes'] / valid, 4)
        cc, ce = county[(int(r0['年']), r0['類別'], r0['當年縣市'])]
        turnout = 100 * cast / electors
        county_turnout = 100 * cc / ce
        results.append(dict(election=rnd, year=int(r0['年']), date=r0['選舉日'], kind='local' if r0['類別'] == '縣市長' else 'president',
                            countyThen=r0['當年縣市'], townThen=r0['當年鄉區名'], electors=electors, cast=cast, valid=valid,
                            invalid=invalid, turnout=round(turnout, 4), countyCast=cc, countyElectors=ce,
                            countyTurnout=round(county_turnout, 4), gap=round(turnout - county_turnout, 4), candidates=cands))
    towns.append(dict(county=c, name=t + ('區' if c in DISTRICT_CITIES else '鄉'), stem=t, results=results))

out = dict(source='中央選舉委員會選舉資料庫開放資料 votedata.zip（2025-01-24 版）', rows=len(rows),
           elections=[dict(id=e, kind='local' if '縣市長' in e else 'president') for e in ORDER], towns=towns)
Path('data/mountain-turnout.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
for i, e in enumerate(ORDER):
    gaps = [t['results'][i]['gap'] for t in towns]
    print(e, round(sum(gaps) / len(gaps), 2), sum(g > 0 for g in gaps))
