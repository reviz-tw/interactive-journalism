(() => {
  const site = 'https://cocoa.cool';
  const fallbackImage = `${site}/assets/cocoa-cool-og.png`;
  const pages = {
    'kaohsiung-electorate.html': ['高雄｜走過嘗試，城市繼續蛻變｜Cocoa.Cool', '高雄曾嘗試不同的政治選擇，經歷罷免與重新選舉後，再由民進黨執政。從38區的歷次選票，回看這座城市走過的轉折。', 'article', 'https://www.thecocoa.cool/assets/kaohsiung-electorate-cover.png?v=830461caad'],
    'new-taipei-electorate.html': ['新北｜藍營長期執政，選民結構怎麼看｜Cocoa.Cool', '新北藍營長期執政，選民的政治期待卻只有一種嗎？以 13 次選舉、29 區與各里資料，比較首長與總統選票、投票率及選民尋找不同政治方向的線索。', 'article', 'https://www.thecocoa.cool/assets/new-taipei-electorate-cover.png?v=b538692cb0'],
    'taipei-electorate.html': ['台北，真的藍大於綠嗎？｜Cocoa.Cool', '探索台北三十年總統與市長選票、行政區與里差異，以及歷年投票率與得票結果。', 'article', `${site}/assets/taipei-electorate-cover.png`],
    'index.html': ['Cocoa.Cool｜互動新聞策展', '從現有新聞出發，以名單、席位、批號、證據與預算等資料結構重新閱讀議題。', 'website'],
    'baseball-heat-to-asiad.html': ['從 12 強到名古屋亞運｜Cocoa.Cool', '用國手履歷與賽事資格，理解一份亞運徵召名單。', 'article'],
    'si-guang-yang-case-file.html': ['佀廣洋爭議事件檔案｜Cocoa.Cool', '以證據狀態與可回查來源，梳理佀廣洋近期爭議。', 'article'],
    'toxic-oil-supply-chain.html': ['一桶油，誰來把關？｜Cocoa.Cool', '從原料到餐桌，辨識毒油事件中各環節的責任、處置與待釐清問題。', 'article'],
    'public-media-budget-timeline.html': ['公視／公廣預算爭議時間軸｜Cocoa.Cool', '沿著預算、治理與公共服務，閱讀公視／公廣的制度脈絡。', 'article'],
    'central-appointments-dashboard.html': ['人事空窗，誰在等？｜Cocoa.Cool', '用席位與程序理解中央政府人事空缺及其制度影響。', 'article'],
    'bnt-vaccine-two-tracks.html': ['Covid-19 期間，台灣疫苗大事記｜Cocoa.Cool', '從採購、捐贈專案到批次與接種資格，沿著可核對的行政紀錄理解台灣的 Covid-19 疫苗歷程。', 'article', `${site}/assets/vaccine-record-og.png`],
    'taipei-child-protection-case.html': ['台北市十歲女童性猥褻案：240 天裡，誰做了什麼決定？｜Cocoa.Cool', '以公開報導與制度資料，整理台北市十歲女童性猥褻案中的通報、評估、安置與後續檢討爭點。', 'article']
  };
  const file = location.pathname.split('/').pop() || 'index.html';
  const [title, description, type, image = fallbackImage] = pages[file] || pages['index.html'];
  const canonical = `${['new-taipei-electorate.html','kaohsiung-electorate.html'].includes(file)?'https://www.thecocoa.cool':site}/${file}`;
  const upsert = (selector, attrs) => {
    let element = document.head.querySelector(selector);
    if (!element) { element = document.createElement('meta'); document.head.appendChild(element); }
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  };
  document.title = title;
  upsert('meta[name="description"]', { name: 'description', content: description });
  upsert('meta[name="robots"]', { name: 'robots', content: 'index,follow' });
  let canonicalLink = document.head.querySelector('link[rel="canonical"]');
  if (!canonicalLink) { canonicalLink = document.createElement('link'); canonicalLink.rel = 'canonical'; document.head.appendChild(canonicalLink); }
  canonicalLink.href = canonical;
  upsert('meta[property="og:type"]', { property: 'og:type', content: type });
  upsert('meta[property="og:locale"]', { property: 'og:locale', content: 'zh_TW' });
  upsert('meta[property="og:site_name"]', { property: 'og:site_name', content: 'Cocoa.Cool' });
  upsert('meta[property="og:title"]', { property: 'og:title', content: title });
  upsert('meta[property="og:description"]', { property: 'og:description', content: description });
  upsert('meta[property="og:url"]', { property: 'og:url', content: canonical });
  upsert('meta[property="og:image"]', { property: 'og:image', content: image });
  upsert('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
  upsert('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
  upsert('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
  upsert('meta[name="twitter:image"]', { name: 'twitter:image', content: image });
})();
